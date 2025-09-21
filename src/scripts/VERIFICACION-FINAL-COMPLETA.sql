-- ===================================================================
-- VERIFICACIÓN FINAL COMPLETA - TODOS LOS DATOS
-- ===================================================================

-- RESUMEN EJECUTIVO
WITH totales AS (
    SELECT 
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as clientes,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as reservas,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet') AND reservation_date = CURRENT_DATE) as reservas_hoy,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as noshows_total,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet') AND reservation_date = CURRENT_DATE) as noshows_hoy,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as conversaciones,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as mensajes,
        (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as crm_opportunities,
        (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as tickets,
        (SELECT ROUND(SUM(total_amount), 2) FROM billing_tickets WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')) as facturacion
)
SELECT 
    '=== DATOS QUE DEBEN APARECER EN LA APP ===' as titulo,
    jsonb_build_object(
        'CLIENTES_TOTAL', clientes,
        'RESERVAS_TOTAL', reservas,
        'RESERVAS_HOY', reservas_hoy,
        'NOSHOWS_TOTAL', noshows_total,
        'NOSHOWS_HOY', noshows_hoy,
        'CONVERSACIONES', conversaciones,
        'MENSAJES', mensajes,
        'CRM_OPPORTUNITIES', crm_opportunities,
        'TICKETS', tickets,
        'FACTURACION', facturacion
    ) as datos_reales
FROM totales;

-- DETALLE DE SEGMENTOS DE CLIENTES
SELECT 
    'SEGMENTOS_CLIENTES' as categoria,
    segment_auto,
    COUNT(*) as cantidad
FROM customers 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')
GROUP BY segment_auto
ORDER BY cantidad DESC;

-- VERIFICAR QUE SUMA
WITH segmentos AS (
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN segment_auto IS NOT NULL THEN 1 ELSE 0 END) as con_segmento
    FROM customers 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet')
)
SELECT 
    'VALIDACION_CLIENTES' as test,
    CASE 
        WHEN total = con_segmento 
        THEN '✅ TODOS LOS CLIENTES TIENEN SEGMENTO'
        ELSE '❌ HAY ' || (total - con_segmento) || ' CLIENTES SIN SEGMENTO'
    END as resultado
FROM segmentos;

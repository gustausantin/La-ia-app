-- ===================================================================
-- AUDITORÍA COMPLETA DE DATOS REALES - TAVERTET
-- ===================================================================
-- Este script verifica QUÉ DATOS TENEMOS REALMENTE en Supabase
-- Para que TODAS las pantallas muestren LO MISMO

-- 1. CLIENTES REALES
SELECT 
    'CLIENTES' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN segment_auto = 'nuevo' THEN 1 END) as nuevos,
    COUNT(CASE WHEN segment_auto = 'vip' THEN 1 END) as vip,
    COUNT(CASE WHEN segment_auto = 'inactivo' THEN 1 END) as inactivos,
    COUNT(CASE WHEN segment_auto = 'en_riesgo' THEN 1 END) as en_riesgo,
    COUNT(CASE WHEN segment_auto = 'regular' THEN 1 END) as regulares,
    COUNT(CASE WHEN visits_count > 0 THEN 1 END) as activos
FROM customers 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 2. NO-SHOWS REALES HOY
SELECT 
    'NO-SHOWS HOY' as tabla,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN customer_response = 'confirmed' THEN 1 END) as confirmados,
    COUNT(CASE WHEN customer_response = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN customer_response = 'cancelled' THEN 1 END) as cancelados,
    COUNT(CASE WHEN final_outcome = 'attended' THEN 1 END) as asistieron,
    COUNT(CASE WHEN final_outcome = 'no_show' THEN 1 END) as no_vinieron
FROM noshow_actions 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
  AND reservation_date = CURRENT_DATE;

-- 3. RESERVAS REALES HOY
SELECT 
    'RESERVAS HOY' as tabla,
    COUNT(*) as total_reservas,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
    COUNT(CASE WHEN reservation_source = 'ia' THEN 1 END) as reservas_ia
FROM reservations 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
  AND reservation_date = CURRENT_DATE;

-- 4. CRM SUGGESTIONS REALES
SELECT 
    'CRM OPPORTUNITIES' as tabla,
    COUNT(*) as total_sugerencias,
    COUNT(CASE WHEN type = 'reactivacion' THEN 1 END) as reactivacion,
    COUNT(CASE WHEN type = 'vip_upgrade' THEN 1 END) as vip_upgrade,
    COUNT(CASE WHEN type = 'feedback' THEN 1 END) as feedback,
    COUNT(CASE WHEN executed_at IS NULL THEN 1 END) as pendientes
FROM crm_suggestions 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- 5. CONVERSACIONES Y MENSAJES
SELECT 
    'COMUNICACIONES' as tabla,
    (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)) as conversaciones,
    (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)) as mensajes,
    (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1) AND status = 'open') as conversaciones_abiertas;

-- 6. TICKETS DE CONSUMO
SELECT 
    'TICKETS' as tabla,
    COUNT(*) as total_tickets,
    ROUND(AVG(total_amount), 2) as ticket_promedio,
    SUM(total_amount) as facturacion_total
FROM billing_tickets 
WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1);

-- RESUMEN FINAL
SELECT 
    '=== RESUMEN EJECUTIVO ===' as seccion,
    'Estos son los datos REALES que deben aparecer en TODAS las pantallas' as instruccion;

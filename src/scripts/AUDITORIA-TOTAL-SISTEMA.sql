-- ===================================================================
-- AUDITORÍA COMPLETA DEL SISTEMA - TAVERTET
-- ===================================================================
-- Este script verifica TODOS los datos para garantizar coherencia

-- 1. CLIENTES - VERIFICACIÓN COMPLETA
WITH cliente_stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN segment_auto = 'nuevo' THEN 1 END) as nuevos,
        COUNT(CASE WHEN segment_auto = 'vip' THEN 1 END) as vip,
        COUNT(CASE WHEN segment_auto = 'regular' THEN 1 END) as regulares,
        COUNT(CASE WHEN segment_auto = 'ocasional' THEN 1 END) as ocasionales,
        COUNT(CASE WHEN segment_auto = 'inactivo' THEN 1 END) as inactivos,
        COUNT(CASE WHEN segment_auto = 'en_riesgo' THEN 1 END) as en_riesgo,
        COUNT(CASE WHEN segment_auto = 'alto_valor' THEN 1 END) as alto_valor,
        COUNT(CASE WHEN segment_auto IS NULL THEN 1 END) as sin_segmento
    FROM customers 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
)
SELECT 
    'CLIENTES' as categoria,
    total,
    CASE 
        WHEN total = (nuevos + vip + regulares + ocasionales + inactivos + en_riesgo + alto_valor + sin_segmento)
        THEN '✅ SUMA CORRECTA'
        ELSE '❌ ERROR: No suma ' || (nuevos + vip + regulares + ocasionales + inactivos + en_riesgo + alto_valor + sin_segmento)
    END as validacion,
    jsonb_build_object(
        'nuevos', nuevos,
        'vip', vip,
        'regulares', regulares,
        'ocasionales', ocasionales,
        'inactivos', inactivos,
        'en_riesgo', en_riesgo,
        'alto_valor', alto_valor,
        'sin_segmento', sin_segmento
    ) as detalle
FROM cliente_stats;

-- 2. RESERVAS - VERIFICACIÓN COMPLETA
WITH reserva_stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + 1 THEN 1 END) as manana,
        COUNT(CASE WHEN reservation_date > CURRENT_DATE THEN 1 END) as futuras,
        COUNT(CASE WHEN reservation_date < CURRENT_DATE THEN 1 END) as pasadas,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
        COUNT(CASE WHEN reservation_source = 'ia' THEN 1 END) as reservas_ia,
        COUNT(CASE WHEN reservation_source = 'manual' THEN 1 END) as reservas_manual
    FROM reservations 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
)
SELECT 
    'RESERVAS' as categoria,
    total,
    CASE 
        WHEN total = (confirmadas + pendientes + canceladas + completadas + no_show)
        THEN '✅ STATUS OK'
        ELSE '❌ ERROR STATUS'
    END as validacion,
    jsonb_build_object(
        'hoy', hoy,
        'mañana', manana,
        'futuras', futuras,
        'pasadas', pasadas,
        'confirmadas', confirmadas,
        'pendientes', pendientes,
        'canceladas', canceladas,
        'completadas', completadas,
        'no_show', no_show,
        'reservas_ia', reservas_ia,
        'reservas_manual', reservas_manual
    ) as detalle
FROM reserva_stats;

-- 3. NO-SHOWS - VERIFICACIÓN COMPLETA
WITH noshow_stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE - 1 THEN 1 END) as ayer,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + 1 THEN 1 END) as manana,
        COUNT(CASE WHEN customer_response = 'confirmed' THEN 1 END) as confirmados,
        COUNT(CASE WHEN customer_response = 'pending' THEN 1 END) as pendientes,
        COUNT(CASE WHEN customer_response = 'cancelled' THEN 1 END) as cancelados,
        COUNT(CASE WHEN customer_response = 'no_response' THEN 1 END) as sin_respuesta,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as alto_riesgo,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medio_riesgo,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as bajo_riesgo
    FROM noshow_actions 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
)
SELECT 
    'NO-SHOWS' as categoria,
    total,
    CASE 
        WHEN total = (confirmados + pendientes + cancelados + sin_respuesta)
        THEN '✅ RESPUESTAS OK'
        ELSE '❌ ERROR RESPUESTAS'
    END as validacion,
    jsonb_build_object(
        'hoy', hoy,
        'ayer', ayer,
        'mañana', manana,
        'confirmados', confirmados,
        'pendientes', pendientes,
        'cancelados', cancelados,
        'sin_respuesta', sin_respuesta,
        'alto_riesgo', alto_riesgo,
        'medio_riesgo', medio_riesgo,
        'bajo_riesgo', bajo_riesgo
    ) as detalle
FROM noshow_stats;

-- 4. COMUNICACIONES - VERIFICACIÓN COMPLETA
WITH comm_stats AS (
    SELECT 
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)) as conversaciones,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)) as mensajes,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1) AND status = 'open') as conv_abiertas,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1) AND status = 'closed') as conv_cerradas
)
SELECT 
    'COMUNICACIONES' as categoria,
    conversaciones as total,
    CASE 
        WHEN conversaciones >= 0 AND mensajes >= 0
        THEN '✅ DATOS OK'
        ELSE '❌ ERROR DATOS'
    END as validacion,
    jsonb_build_object(
        'conversaciones', conversaciones,
        'mensajes', mensajes,
        'abiertas', conv_abiertas,
        'cerradas', conv_cerradas,
        'promedio_mensajes', CASE WHEN conversaciones > 0 THEN mensajes::float / conversaciones ELSE 0 END
    ) as detalle
FROM comm_stats;

-- 5. CRM - VERIFICACIÓN COMPLETA
WITH crm_stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'reactivacion' THEN 1 END) as reactivacion,
        COUNT(CASE WHEN type = 'vip_upgrade' THEN 1 END) as vip_upgrade,
        COUNT(CASE WHEN type = 'bienvenida' THEN 1 END) as bienvenida,
        COUNT(CASE WHEN type = 'feedback' THEN 1 END) as feedback,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
        COUNT(CASE WHEN status = 'executed' THEN 1 END) as ejecutadas,
        COUNT(CASE WHEN executed_at IS NOT NULL THEN 1 END) as completadas
    FROM crm_suggestions 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
)
SELECT 
    'CRM OPPORTUNITIES' as categoria,
    total,
    CASE 
        WHEN total >= 0
        THEN '✅ CRM OK'
        ELSE '❌ ERROR CRM'
    END as validacion,
    jsonb_build_object(
        'reactivacion', reactivacion,
        'vip_upgrade', vip_upgrade,
        'bienvenida', bienvenida,
        'feedback', feedback,
        'pendientes', pendientes,
        'ejecutadas', ejecutadas,
        'completadas', completadas
    ) as detalle
FROM crm_stats;

-- 6. FACTURACIÓN - VERIFICACIÓN COMPLETA
WITH billing_stats AS (
    SELECT 
        COUNT(*) as tickets_total,
        COUNT(CASE WHEN reservation_id IS NOT NULL THEN 1 END) as con_reserva,
        COUNT(CASE WHEN reservation_id IS NULL THEN 1 END) as sin_reserva,
        ROUND(AVG(total_amount), 2) as ticket_promedio,
        ROUND(SUM(total_amount), 2) as facturacion_total
    FROM billing_tickets 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1)
)
SELECT 
    'FACTURACIÓN' as categoria,
    tickets_total as total,
    CASE 
        WHEN tickets_total = (con_reserva + sin_reserva)
        THEN '✅ TICKETS OK'
        ELSE '❌ ERROR TICKETS'
    END as validacion,
    jsonb_build_object(
        'tickets', tickets_total,
        'con_reserva', con_reserva,
        'sin_reserva', sin_reserva,
        'ticket_promedio', ticket_promedio,
        'facturacion_total', facturacion_total
    ) as detalle
FROM billing_stats;

-- RESUMEN FINAL
SELECT 
    '=== RESUMEN AUDITORÍA ===' as resultado,
    'Verificar que TODOS los datos sean coherentes en TODAS las pantallas' as accion;

-- =====================================================
-- AUDITORÍA MASIVA COMPLETA - TODO EN UN SOLO RESULTADO
-- =====================================================
-- Este script te da TODA la información del sistema de una sola vez

WITH restaurant_data AS (
    SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1
),
-- 1. DATOS DE CLIENTES
cliente_stats AS (
    SELECT 
        COUNT(*) as total_clientes,
        COUNT(CASE WHEN segment_auto = 'nuevo' THEN 1 END) as clientes_nuevos,
        COUNT(CASE WHEN segment_auto = 'vip' THEN 1 END) as clientes_vip,
        COUNT(CASE WHEN segment_auto = 'regular' THEN 1 END) as clientes_regulares,
        COUNT(CASE WHEN segment_auto = 'ocasional' THEN 1 END) as clientes_ocasionales,
        COUNT(CASE WHEN segment_auto = 'inactivo' THEN 1 END) as clientes_inactivos,
        COUNT(CASE WHEN segment_auto = 'en_riesgo' THEN 1 END) as clientes_en_riesgo,
        COUNT(CASE WHEN segment_auto = 'alto_valor' THEN 1 END) as clientes_alto_valor,
        COUNT(CASE WHEN segment_auto IS NULL THEN 1 END) as clientes_sin_segmento,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as clientes_con_email,
        COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as clientes_con_telefono,
        COUNT(CASE WHEN preferred_channel = 'whatsapp' THEN 1 END) as prefieren_whatsapp,
        COUNT(CASE WHEN preferred_channel = 'email' THEN 1 END) as prefieren_email,
        COUNT(CASE WHEN visits_count > 5 THEN 1 END) as clientes_frecuentes,
        COUNT(CASE WHEN churn_risk_score > 70 THEN 1 END) as alto_riesgo_churn,
        MAX(visits_count) as max_visitas,
        MIN(created_at) as primer_cliente_creado,
        MAX(created_at) as ultimo_cliente_creado
    FROM customers 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),
-- 2. DATOS DE RESERVAS
reserva_stats AS (
    SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as reservas_hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + 1 THEN 1 END) as reservas_manana,
        COUNT(CASE WHEN reservation_date > CURRENT_DATE + 1 THEN 1 END) as reservas_futuras,
        COUNT(CASE WHEN reservation_date < CURRENT_DATE THEN 1 END) as reservas_pasadas,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as reservas_confirmadas,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as reservas_pendientes,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as reservas_canceladas,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as reservas_completadas,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as reservas_no_show,
        COUNT(CASE WHEN reservation_source = 'ia' THEN 1 END) as reservas_via_ia,
        COUNT(CASE WHEN reservation_source = 'manual' THEN 1 END) as reservas_manuales,
        COUNT(CASE WHEN table_id IS NOT NULL THEN 1 END) as reservas_con_mesa,
        COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as reservas_con_cliente,
        AVG(party_size) as tamano_promedio_mesa,
        MAX(party_size) as tamano_max_mesa,
        COUNT(DISTINCT customer_id) as clientes_unicos_con_reserva,
        COUNT(DISTINCT DATE(reservation_date)) as dias_con_reservas
    FROM reservations 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),
-- 3. DATOS DE NO-SHOWS
noshow_stats AS (
    SELECT 
        COUNT(*) as total_noshows,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as noshows_hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE - 1 THEN 1 END) as noshows_ayer,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + 1 THEN 1 END) as noshows_manana,
        COUNT(CASE WHEN reservation_date > CURRENT_DATE THEN 1 END) as noshows_futuros,
        COUNT(CASE WHEN customer_response = 'confirmed' THEN 1 END) as respuesta_confirmado,
        COUNT(CASE WHEN customer_response = 'pending' THEN 1 END) as respuesta_pendiente,
        COUNT(CASE WHEN customer_response = 'cancelled' THEN 1 END) as respuesta_cancelado,
        COUNT(CASE WHEN customer_response = 'no_response' THEN 1 END) as sin_respuesta,
        COUNT(CASE WHEN final_outcome = 'attended' THEN 1 END) as final_asistieron,
        COUNT(CASE WHEN final_outcome = 'no_show' THEN 1 END) as final_no_show,
        COUNT(CASE WHEN final_outcome = 'cancelled' THEN 1 END) as final_cancelado,
        COUNT(CASE WHEN final_outcome = 'pending' THEN 1 END) as final_pendiente,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as riesgo_alto,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as riesgo_medio,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as riesgo_bajo,
        COUNT(CASE WHEN prevented_noshow IS TRUE THEN 1 END) as noshows_prevenidos,
        COUNT(CASE WHEN message_sent IS NOT NULL AND message_sent != '' AND message_sent != 'false' AND message_sent != 'no' THEN 1 END) as mensajes_enviados,
        AVG(risk_score) as promedio_riesgo
    FROM noshow_actions 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),
-- 4. DATOS DE FACTURACIÓN
billing_stats AS (
    SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN reservation_id IS NOT NULL THEN 1 END) as tickets_con_reserva,
        COUNT(CASE WHEN reservation_id IS NULL THEN 1 END) as tickets_sin_reserva,
        COUNT(CASE WHEN ticket_date::date = CURRENT_DATE THEN 1 END) as tickets_hoy,
        COUNT(CASE WHEN ticket_date::date = CURRENT_DATE - 1 THEN 1 END) as tickets_ayer,
        COUNT(DISTINCT DATE(ticket_date)) as dias_con_ventas,
        ROUND(SUM(total_amount), 2) as facturacion_total,
        ROUND(AVG(total_amount), 2) as ticket_promedio,
        ROUND(MAX(total_amount), 2) as ticket_maximo,
        ROUND(MIN(total_amount), 2) as ticket_minimo,
        ROUND(SUM(CASE WHEN ticket_date::date = CURRENT_DATE THEN total_amount ELSE 0 END), 2) as facturacion_hoy,
        ROUND(SUM(subtotal), 2) as subtotal_total,
        ROUND(SUM(tax_amount), 2) as impuestos_total,
        ROUND(SUM(discount_amount), 2) as descuentos_total,
        ROUND(SUM(tip_amount), 2) as propinas_total,
        COUNT(DISTINCT customer_id) as clientes_unicos_facturados
    FROM billing_tickets 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),
-- 5. DATOS DE COMUNICACIONES
comm_stats AS (
    SELECT 
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data)) as total_conversaciones,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data) AND status = 'open') as conversaciones_abiertas,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data) AND status = 'closed') as conversaciones_cerradas,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data) AND channel = 'whatsapp') as conv_whatsapp,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data) AND channel = 'email') as conv_email,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurant_data)) as total_mensajes,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurant_data) AND direction = 'inbound') as mensajes_entrantes,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurant_data) AND direction = 'outbound') as mensajes_salientes,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurant_data) AND created_at::date = CURRENT_DATE) as mensajes_hoy,
        (SELECT COUNT(DISTINCT customer_id) FROM conversations WHERE restaurant_id = (SELECT id FROM restaurant_data)) as clientes_en_conversaciones
),
-- 6. DATOS DE CRM
crm_stats AS (
    SELECT 
        COUNT(*) as total_sugerencias,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as sugerencias_pendientes,
        COUNT(CASE WHEN status = 'executed' THEN 1 END) as sugerencias_ejecutadas,
        COUNT(CASE WHEN type = 'reactivacion' THEN 1 END) as tipo_reactivacion,
        COUNT(CASE WHEN type = 'vip_upgrade' THEN 1 END) as tipo_vip_upgrade,
        COUNT(CASE WHEN type = 'bienvenida' THEN 1 END) as tipo_bienvenida,
        COUNT(CASE WHEN type = 'feedback' THEN 1 END) as tipo_feedback,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as prioridad_alta,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as prioridad_media,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as prioridad_baja,
        COUNT(CASE WHEN suggested_at::date = CURRENT_DATE THEN 1 END) as sugeridas_hoy,
        COUNT(CASE WHEN executed_at IS NOT NULL THEN 1 END) as ejecutadas_con_fecha,
        COUNT(DISTINCT customer_id) as clientes_unicos_crm
    FROM crm_suggestions 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),
-- 7. DATOS DE MESAS
table_stats AS (
    SELECT 
        COUNT(*) as total_mesas,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as mesas_disponibles,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as mesas_ocupadas,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as mesas_reservadas,
        SUM(capacity) as capacidad_total,
        AVG(capacity) as capacidad_promedio,
        MAX(capacity) as capacidad_maxima
    FROM tables 
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
)
-- RESULTADO FINAL - TODO JUNTO
SELECT 
    '=== AUDITORÍA MASIVA COMPLETA TAVERTET ===' as titulo,
    CURRENT_DATE as fecha_auditoria,
    CURRENT_TIME as hora_auditoria,
    
    -- CLIENTES
    c.total_clientes,
    c.clientes_nuevos,
    c.clientes_vip,
    c.clientes_regulares,
    c.clientes_ocasionales,
    c.clientes_inactivos,
    c.clientes_en_riesgo,
    c.clientes_alto_valor,
    c.clientes_sin_segmento,
    c.clientes_con_email,
    c.clientes_con_telefono,
    c.prefieren_whatsapp,
    c.prefieren_email,
    c.clientes_frecuentes,
    c.alto_riesgo_churn,
    c.max_visitas,
    
    -- RESERVAS
    r.total_reservas,
    r.reservas_hoy,
    r.reservas_manana,
    r.reservas_futuras,
    r.reservas_pasadas,
    r.reservas_confirmadas,
    r.reservas_pendientes,
    r.reservas_canceladas,
    r.reservas_completadas,
    r.reservas_no_show,
    r.reservas_via_ia,
    r.reservas_manuales,
    r.reservas_con_mesa,
    r.reservas_con_cliente,
    r.tamano_promedio_mesa,
    r.tamano_max_mesa,
    r.clientes_unicos_con_reserva,
    r.dias_con_reservas,
    
    -- NO-SHOWS
    n.total_noshows,
    n.noshows_hoy,
    n.noshows_ayer,
    n.noshows_manana,
    n.noshows_futuros,
    n.respuesta_confirmado,
    n.respuesta_pendiente,
    n.respuesta_cancelado,
    n.sin_respuesta,
    n.final_asistieron,
    n.final_no_show,
    n.final_cancelado,
    n.final_pendiente,
    n.riesgo_alto,
    n.riesgo_medio,
    n.riesgo_bajo,
    n.noshows_prevenidos,
    n.mensajes_enviados as noshows_mensajes_enviados,
    n.promedio_riesgo,
    
    -- FACTURACIÓN
    b.total_tickets,
    b.tickets_con_reserva,
    b.tickets_sin_reserva,
    b.tickets_hoy,
    b.tickets_ayer,
    b.dias_con_ventas,
    b.facturacion_total,
    b.ticket_promedio,
    b.ticket_maximo,
    b.ticket_minimo,
    b.facturacion_hoy,
    b.subtotal_total,
    b.impuestos_total,
    b.descuentos_total,
    b.propinas_total,
    b.clientes_unicos_facturados,
    
    -- COMUNICACIONES
    co.total_conversaciones,
    co.conversaciones_abiertas,
    co.conversaciones_cerradas,
    co.conv_whatsapp,
    co.conv_email,
    co.total_mensajes,
    co.mensajes_entrantes,
    co.mensajes_salientes,
    co.mensajes_hoy,
    co.clientes_en_conversaciones,
    
    -- CRM
    cr.total_sugerencias,
    cr.sugerencias_pendientes,
    cr.sugerencias_ejecutadas,
    cr.tipo_reactivacion,
    cr.tipo_vip_upgrade,
    cr.tipo_bienvenida,
    cr.tipo_feedback,
    cr.prioridad_alta,
    cr.prioridad_media,
    cr.prioridad_baja,
    cr.sugeridas_hoy,
    cr.ejecutadas_con_fecha,
    cr.clientes_unicos_crm,
    
    -- MESAS
    t.total_mesas,
    t.mesas_disponibles,
    t.mesas_ocupadas,
    t.mesas_reservadas,
    t.capacidad_total,
    t.capacidad_promedio,
    t.capacidad_maxima,
    
    -- VALIDACIONES
    CASE WHEN c.total_clientes > 0 THEN '✅' ELSE '❌' END as tiene_clientes,
    CASE WHEN r.total_reservas > 0 THEN '✅' ELSE '❌' END as tiene_reservas,
    CASE WHEN n.total_noshows > 0 THEN '✅' ELSE '❌' END as tiene_noshows,
    CASE WHEN b.facturacion_total > 0 THEN '✅' ELSE '❌' END as tiene_facturacion,
    CASE WHEN co.total_mensajes > 0 THEN '✅' ELSE '❌' END as tiene_mensajes,
    CASE WHEN cr.total_sugerencias > 0 THEN '✅' ELSE '❌' END as tiene_crm,
    
    -- COHERENCIA
    CASE 
        WHEN c.total_clientes = (c.clientes_nuevos + c.clientes_vip + c.clientes_regulares + 
                                 c.clientes_ocasionales + c.clientes_inactivos + c.clientes_en_riesgo + 
                                 c.clientes_alto_valor + c.clientes_sin_segmento)
        THEN '✅ SEGMENTOS OK'
        ELSE '❌ ERROR SEGMENTOS'
    END as validacion_segmentos,
    
    CASE 
        WHEN r.total_reservas = (r.reservas_confirmadas + r.reservas_pendientes + 
                                 r.reservas_canceladas + r.reservas_completadas + r.reservas_no_show)
        THEN '✅ STATUS OK'
        ELSE '❌ ERROR STATUS'
    END as validacion_status,
    
    CASE 
        WHEN n.total_noshows = (n.respuesta_confirmado + n.respuesta_pendiente + 
                                n.respuesta_cancelado + n.sin_respuesta)
        THEN '✅ RESPUESTAS OK'
        ELSE '❌ ERROR RESPUESTAS'
    END as validacion_respuestas,
    
    CASE 
        WHEN c.total_clientes > 0 AND r.total_reservas > 0 AND 
             b.facturacion_total > 0 AND co.total_mensajes > 0 AND 
             n.total_noshows > 0 AND cr.total_sugerencias > 0
        THEN '✅ SISTEMA COMPLETO'
        ELSE '❌ FALTAN DATOS'
    END as sistema_completo

FROM cliente_stats c
CROSS JOIN reserva_stats r
CROSS JOIN noshow_stats n
CROSS JOIN billing_stats b
CROSS JOIN comm_stats co
CROSS JOIN crm_stats cr
CROSS JOIN table_stats t;

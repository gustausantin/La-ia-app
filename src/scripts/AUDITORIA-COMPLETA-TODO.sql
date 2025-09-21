-- =====================================================
-- AUDITORÍA COMPLETA DEL SISTEMA - TODO EN UNA CONSULTA
-- =====================================================
-- Este script te dará TODA la información en un solo resultado
-- Copia y pega en Supabase SQL Editor

WITH restaurant_info AS (
  SELECT 
    r.id as restaurant_id,
    r.name as restaurant_name
  FROM restaurants r
  WHERE r.name = 'Tavertet'
  LIMIT 1
),
counts_data AS (
  SELECT 
    (SELECT COUNT(*) FROM customers WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_customers,
    (SELECT COUNT(*) FROM reservations WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info) AND reservation_date = CURRENT_DATE) as reservations_today,
    (SELECT COUNT(*) FROM reservations WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info) AND reservation_date = CURRENT_DATE + 1) as reservations_tomorrow,
    (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_tickets,
    (SELECT COUNT(*) FROM conversations WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_conversations,
    (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_messages,
    (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_noshows,
    (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info) AND reservation_date = CURRENT_DATE) as noshows_today,
    (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_crm_alerts,
    (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info) AND status = 'pending') as crm_pending,
    (SELECT COUNT(*) FROM tables WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as total_tables
),
segments_data AS (
  SELECT 
    COUNT(CASE WHEN segment_auto = 'nuevo' THEN 1 END) as clientes_nuevos,
    COUNT(CASE WHEN segment_auto = 'ocasional' THEN 1 END) as clientes_ocasionales,
    COUNT(CASE WHEN segment_auto = 'regular' THEN 1 END) as clientes_regulares,
    COUNT(CASE WHEN segment_auto = 'vip' THEN 1 END) as clientes_vip,
    COUNT(CASE WHEN segment_auto = 'en_riesgo' THEN 1 END) as clientes_en_riesgo,
    COUNT(CASE WHEN segment_auto = 'inactivo' THEN 1 END) as clientes_inactivos,
    COUNT(CASE WHEN segment_auto = 'alto_valor' THEN 1 END) as clientes_alto_valor
  FROM customers 
  WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)
),
money_data AS (
  SELECT 
    COALESCE(SUM(total_amount), 0) as facturacion_total,
    COALESCE(AVG(total_amount), 0) as ticket_promedio,
    COALESCE(MAX(total_amount), 0) as ticket_maximo,
    COUNT(DISTINCT DATE(ticket_date)) as dias_con_ventas
  FROM billing_tickets 
  WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)
),
today_details AS (
  SELECT 
    COUNT(DISTINCT r.id) as reservas_hoy,
    COUNT(DISTINCT n.id) as noshows_gestionados_hoy,
    COUNT(DISTINCT CASE WHEN n.risk_level = 'high' THEN n.id END) as alto_riesgo_hoy,
    COUNT(DISTINCT CASE WHEN n.risk_level = 'medium' THEN n.id END) as medio_riesgo_hoy,
    COUNT(DISTINCT CASE WHEN n.final_outcome = 'attended' THEN n.id END) as prevenidos_hoy
  FROM reservations r
  LEFT JOIN noshow_actions n ON n.reservation_date = r.reservation_date 
    AND n.restaurant_id = r.restaurant_id
  WHERE r.restaurant_id = (SELECT restaurant_id FROM restaurant_info)
    AND r.reservation_date = CURRENT_DATE
),
recent_activity AS (
  SELECT 
    (SELECT MAX(created_at) FROM customers WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultima_creacion_cliente,
    (SELECT MAX(created_at) FROM reservations WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultima_reserva,
    (SELECT MAX(created_at) FROM billing_tickets WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultimo_ticket,
    (SELECT MAX(created_at) FROM messages WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultimo_mensaje,
    (SELECT MAX(created_at) FROM noshow_actions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultima_accion_noshow,
    (SELECT MAX(created_at) FROM crm_suggestions WHERE restaurant_id = (SELECT restaurant_id FROM restaurant_info)) as ultima_sugerencia_crm
)
SELECT 
  '=== RESUMEN COMPLETO SISTEMA ===' as categoria,
  jsonb_build_object(
    'RESTAURANTE', (SELECT restaurant_name FROM restaurant_info),
    'FECHA_ACTUAL', CURRENT_DATE::text,
    'HORA_ACTUAL', CURRENT_TIME::text,
    
    '1_TOTALES_PRINCIPALES', jsonb_build_object(
      'total_clientes', c.total_customers,
      'total_reservas', c.total_reservations,
      'reservas_hoy', c.reservations_today,
      'reservas_mañana', c.reservations_tomorrow,
      'total_tickets', c.total_tickets,
      'total_conversaciones', c.total_conversations,
      'total_mensajes', c.total_messages,
      'total_noshows', c.total_noshows,
      'noshows_hoy', c.noshows_today,
      'total_crm_alertas', c.total_crm_alerts,
      'crm_pendientes', c.crm_pending,
      'total_mesas', c.total_tables
    ),
    
    '2_SEGMENTACION_CLIENTES', jsonb_build_object(
      'nuevos', s.clientes_nuevos,
      'ocasionales', s.clientes_ocasionales,
      'regulares', s.clientes_regulares,
      'vip', s.clientes_vip,
      'en_riesgo', s.clientes_en_riesgo,
      'inactivos', s.clientes_inactivos,
      'alto_valor', s.clientes_alto_valor,
      'TOTAL', s.clientes_nuevos + s.clientes_ocasionales + s.clientes_regulares + 
               s.clientes_vip + s.clientes_en_riesgo + s.clientes_inactivos + s.clientes_alto_valor
    ),
    
    '3_FACTURACION', jsonb_build_object(
      'facturacion_total_euros', m.facturacion_total,
      'ticket_promedio_euros', ROUND(m.ticket_promedio, 2),
      'ticket_maximo_euros', m.ticket_maximo,
      'dias_con_ventas', m.dias_con_ventas
    ),
    
    '4_HOY_DETALLE', jsonb_build_object(
      'reservas_confirmadas', t.reservas_hoy,
      'noshows_gestionados', t.noshows_gestionados_hoy,
      'alto_riesgo', t.alto_riesgo_hoy,
      'medio_riesgo', t.medio_riesgo_hoy,
      'noshows_prevenidos', t.prevenidos_hoy
    ),
    
    '5_ULTIMAS_ACTIVIDADES', jsonb_build_object(
      'ultimo_cliente_creado', TO_CHAR(r.ultima_creacion_cliente, 'DD/MM/YYYY HH24:MI'),
      'ultima_reserva_creada', TO_CHAR(r.ultima_reserva, 'DD/MM/YYYY HH24:MI'),
      'ultimo_ticket_creado', TO_CHAR(r.ultimo_ticket, 'DD/MM/YYYY HH24:MI'),
      'ultimo_mensaje_enviado', TO_CHAR(r.ultimo_mensaje, 'DD/MM/YYYY HH24:MI'),
      'ultima_gestion_noshow', TO_CHAR(r.ultima_accion_noshow, 'DD/MM/YYYY HH24:MI'),
      'ultima_alerta_crm', TO_CHAR(r.ultima_sugerencia_crm, 'DD/MM/YYYY HH24:MI')
    ),
    
    '6_VALIDACION_DATOS', jsonb_build_object(
      'tiene_clientes', c.total_customers > 0,
      'tiene_reservas', c.total_reservations > 0,
      'tiene_facturacion', m.facturacion_total > 0,
      'tiene_comunicaciones', c.total_messages > 0,
      'tiene_noshows', c.total_noshows > 0,
      'tiene_crm', c.total_crm_alerts > 0,
      'sistema_completo', 
        c.total_customers > 0 AND 
        c.total_reservations > 0 AND 
        m.facturacion_total > 0 AND 
        c.total_messages > 0 AND 
        c.total_noshows > 0 AND 
        c.total_crm_alerts > 0
    )
  ) as datos
FROM counts_data c
CROSS JOIN segments_data s
CROSS JOIN money_data m
CROSS JOIN today_details t
CROSS JOIN recent_activity r;

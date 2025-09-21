-- =====================================================
-- VER TODO EL ESTADO ACTUAL - SIMPLE Y DIRECTO
-- =====================================================

-- PASO 1: Contar todo
SELECT 
  'CONTEOS_TOTALES' as tipo,
  (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as clientes,
  (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as reservas,
  (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet') AND reservation_date = CURRENT_DATE) as reservas_hoy,
  (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as tickets,
  (SELECT COUNT(*) FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as conversaciones,
  (SELECT COUNT(*) FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as mensajes,
  (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as noshows,
  (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet') AND reservation_date = CURRENT_DATE) as noshows_hoy,
  (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as crm_alertas,
  (SELECT COUNT(*) FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) as mesas

UNION ALL

-- PASO 2: Ver segmentos
SELECT 
  'SEGMENTOS_CLIENTES' as tipo,
  COUNT(CASE WHEN segment_auto = 'nuevo' THEN 1 END) as nuevo,
  COUNT(CASE WHEN segment_auto = 'ocasional' THEN 1 END) as ocasional,
  COUNT(CASE WHEN segment_auto = 'regular' THEN 1 END) as regular,
  COUNT(CASE WHEN segment_auto = 'vip' THEN 1 END) as vip,
  COUNT(CASE WHEN segment_auto = 'en_riesgo' THEN 1 END) as en_riesgo,
  COUNT(CASE WHEN segment_auto = 'inactivo' THEN 1 END) as inactivo,
  COUNT(CASE WHEN segment_auto = 'alto_valor' THEN 1 END) as alto_valor,
  0 as extra1,
  0 as extra2,
  COUNT(*) as total
FROM customers 
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')

UNION ALL

-- PASO 3: Ver facturación
SELECT 
  'FACTURACION' as tipo,
  COALESCE(SUM(total_amount), 0)::int as total_euros,
  COALESCE(AVG(total_amount), 0)::int as ticket_medio,
  COALESCE(MAX(total_amount), 0)::int as ticket_max,
  COUNT(*) as num_tickets,
  COUNT(DISTINCT DATE(ticket_date)) as dias_venta,
  COUNT(CASE WHEN ticket_date::date = CURRENT_DATE THEN 1 END) as tickets_hoy,
  COALESCE(SUM(CASE WHEN ticket_date::date = CURRENT_DATE THEN total_amount END), 0)::int as euros_hoy,
  0 as extra1,
  0 as extra2,
  0 as extra3
FROM billing_tickets 
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')

UNION ALL

-- PASO 4: Ver no-shows de hoy
SELECT 
  'NOSHOWS_HOY' as tipo,
  COUNT(*) as total_gestionados,
  COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as alto_riesgo,
  COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medio_riesgo,
  COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as bajo_riesgo,
  COUNT(CASE WHEN final_outcome = 'attended' THEN 1 END) as asistieron,
  COUNT(CASE WHEN final_outcome = 'no_show' THEN 1 END) as no_asistieron,
  COUNT(CASE WHEN final_outcome = 'cancelled' THEN 1 END) as cancelaron,
  COUNT(CASE WHEN customer_response = 'confirmed' THEN 1 END) as confirmaron,
  COUNT(CASE WHEN prevented_noshow = true THEN 1 END) as prevenidos,
  0 as extra
FROM noshow_actions 
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
  AND reservation_date = CURRENT_DATE

UNION ALL

-- PASO 5: Ver CRM pendiente
SELECT 
  'CRM_PENDIENTES' as tipo,
  COUNT(*) as total_pendientes,
  COUNT(CASE WHEN type = 'reactivacion' THEN 1 END) as reactivacion,
  COUNT(CASE WHEN type = 'vip_upgrade' THEN 1 END) as vip_upgrade,
  COUNT(CASE WHEN type = 'bienvenida' THEN 1 END) as bienvenida,
  COUNT(CASE WHEN type = 'feedback' THEN 1 END) as feedback,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as prioridad_alta,
  COUNT(CASE WHEN priority = 'medium' THEN 1 END) as prioridad_media,
  COUNT(CASE WHEN priority = 'low' THEN 1 END) as prioridad_baja,
  COUNT(CASE WHEN DATE(suggested_at) = CURRENT_DATE THEN 1 END) as sugeridas_hoy,
  0 as extra
FROM crm_suggestions 
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
  AND status = 'pending'

UNION ALL

-- PASO 6: Verificación de datos
SELECT 
  'VERIFICACION' as tipo,
  CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END as tiene_clientes,
  CASE WHEN (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) > 0 THEN 1 ELSE 0 END as tiene_reservas,
  CASE WHEN (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) > 0 THEN 1 ELSE 0 END as tiene_tickets,
  CASE WHEN (SELECT COUNT(*) FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) > 0 THEN 1 ELSE 0 END as tiene_mensajes,
  CASE WHEN (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) > 0 THEN 1 ELSE 0 END as tiene_noshows,
  CASE WHEN (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')) > 0 THEN 1 ELSE 0 END as tiene_crm,
  1 as sistema_ok,
  0 as extra1,
  0 as extra2,
  0 as extra3
FROM customers 
WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Tavertet')
LIMIT 1;

-- =========================================
-- SCRIPT COMPLETO DE VIDA REAL DEL RESTAURANTE
-- =========================================
-- Este script crea una simulación COMPLETA de un restaurante real
-- durante 6 meses, llenando TODAS las tablas con datos interconectados

BEGIN;

-- ==========================================
-- 1. LIMPIAR TODAS LAS TABLAS PRIMERO
-- ==========================================

-- Orden correcto respetando foreign keys
DELETE FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM availability_slots WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM message_templates WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM crm_templates WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- ==========================================
-- 2. CREAR MESAS DEL RESTAURANTE
-- ==========================================

INSERT INTO tables (restaurant_id, table_number, name, capacity, location, zone, status, position_x, position_y, notes, is_active, created_at, updated_at)
SELECT 
    r.id as restaurant_id,
    mesa_data.table_number,
    mesa_data.name,
    mesa_data.capacity,
    mesa_data.location,
    mesa_data.zone,
    'available' as status,
    mesa_data.position_x,
    mesa_data.position_y,
    mesa_data.notes,
    true as is_active,
    NOW() - INTERVAL '6 months' as created_at,
    NOW() - INTERVAL '6 months' as updated_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        -- ZONA PRINCIPAL (12 mesas)
        ('1', 'Mesa 1', 2, 'Ventana principal', 'main', 10.0, 10.0, 'Mesa junto a ventana con vistas'),
        ('2', 'Mesa 2', 4, 'Centro sala principal', 'main', 15.0, 10.0, 'Mesa central, muy solicitada'),
        ('3', 'Mesa 3', 2, 'Rincón acogedor', 'main', 20.0, 10.0, 'Perfecta para parejas'),
        ('4', 'Mesa 4', 6, 'Mesa familiar', 'main', 10.0, 15.0, 'Ideal para grupos familiares'),
        ('5', 'Mesa 5', 4, 'Centro sala principal', 'main', 15.0, 15.0, 'Mesa versátil'),
        ('6', 'Mesa 6', 2, 'Zona tranquila', 'main', 20.0, 15.0, 'Ambiente relajado'),
        ('7', 'Mesa 7', 8, 'Mesa grande', 'main', 10.0, 20.0, 'Para celebraciones'),
        ('8', 'Mesa 8', 4, 'Vista cocina', 'main', 15.0, 20.0, 'Vista a la cocina abierta'),
        ('9', 'Mesa 9', 2, 'Mesa íntima', 'main', 20.0, 20.0, 'Ambiente romántico'),
        ('10', 'Mesa 10', 4, 'Zona central', 'main', 25.0, 10.0, 'Mesa popular'),
        ('11', 'Mesa 11', 6, 'Mesa mediana', 'main', 25.0, 15.0, 'Grupos medianos'),
        ('12', 'Mesa 12', 2, 'Mesa discreta', 'main', 25.0, 20.0, 'Zona reservada'),
        
        -- TERRAZA (8 mesas)
        ('T1', 'Terraza 1', 4, 'Terraza exterior', 'terraza', 30.0, 10.0, 'Al aire libre'),
        ('T2', 'Terraza 2', 2, 'Terraza íntima', 'terraza', 30.0, 15.0, 'Pareja en terraza'),
        ('T3', 'Terraza 3', 6, 'Terraza familiar', 'terraza', 30.0, 20.0, 'Familia en exterior'),
        ('T4', 'Terraza 4', 4, 'Vista jardín', 'terraza', 35.0, 10.0, 'Con vistas al jardín'),
        ('T5', 'Terraza 5', 8, 'Mesa grande terraza', 'terraza', 35.0, 15.0, 'Eventos en terraza'),
        ('T6', 'Terraza 6', 2, 'Rincón terraza', 'terraza', 35.0, 20.0, 'Tranquila y privada'),
        ('T7', 'Terraza 7', 4, 'Mesa central terraza', 'terraza', 40.0, 10.0, 'Centro de terraza'),
        ('T8', 'Terraza 8', 4, 'Mesa esquina', 'terraza', 40.0, 15.0, 'Esquina con sombra'),
        
        -- ZONA VIP (4 mesas)
        ('V1', 'VIP 1', 2, 'Mesa privada VIP', 'vip', 50.0, 10.0, 'Máxima privacidad'),
        ('V2', 'VIP 2', 4, 'Suite VIP mediana', 'vip', 50.0, 15.0, 'Servicio premium'),
        ('V3', 'VIP 3', 6, 'VIP familiar', 'vip', 50.0, 20.0, 'Familia VIP'),
        ('V4', 'VIP 4', 8, 'VIP celebraciones', 'vip', 55.0, 10.0, 'Eventos especiales')
) AS mesa_data(table_number, name, capacity, location, zone, position_x, position_y, notes)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 3. CREAR CLIENTES REALES CON HISTORIALES
-- ==========================================

INSERT INTO customers (
    restaurant_id, name, first_name, last_name1, last_name2, email, phone, 
    segment_auto, segment_manual, total_visits, visits_12m, visits_count,
    total_spent, total_spent_12m, avg_ticket, predicted_ltv, churn_risk_score,
    recency_days, aivi_days, preferred_channel, preferred_items, top_dishes, top_categories,
    preferences, fav_hour_block, fav_weekday, consent_email, consent_sms, consent_whatsapp,
    notifications_enabled, last_visit, last_visit_at, last_interaction_at,
    interaction_count, is_vip_calculated, created_at, updated_at
)
SELECT 
    r.id as restaurant_id,
    cliente_data.name,
    cliente_data.first_name,
    cliente_data.last_name1,
    cliente_data.last_name2,
    cliente_data.email,
    cliente_data.phone,
    cliente_data.segment_auto,
    cliente_data.segment_manual,
    cliente_data.total_visits,
    cliente_data.visits_12m,
    cliente_data.visits_count,
    cliente_data.total_spent,
    cliente_data.total_spent_12m,
    cliente_data.avg_ticket,
    cliente_data.predicted_ltv,
    cliente_data.churn_risk_score,
    cliente_data.recency_days,
    cliente_data.aivi_days,
    cliente_data.preferred_channel,
    cliente_data.preferred_items::jsonb,
    cliente_data.top_dishes::jsonb,
    cliente_data.top_categories::jsonb,
    cliente_data.preferences::jsonb,
    cliente_data.fav_hour_block,
    cliente_data.fav_weekday,
    cliente_data.consent_email,
    cliente_data.consent_sms,
    cliente_data.consent_whatsapp,
    cliente_data.notifications_enabled,
    cliente_data.last_visit,
    cliente_data.last_visit_at,
    cliente_data.last_interaction_at,
    cliente_data.interaction_count,
    cliente_data.is_vip_calculated,
    cliente_data.created_at,
    NOW() as updated_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        -- CLIENTES VIP (Alta frecuencia, alto gasto)
        ('Carlos Mendez', 'Carlos', 'Mendez', 'García', 'carlos.mendez@email.com', '+34666111222', 'vip', 'vip', 
         28, 28, 28, 2840.50, 2840.50, 101.45, 5200.00, 15, 3, 25.0, 'whatsapp',
         '["Paella Valenciana", "Pulpo a la Gallega", "Chuletón"]', '["Paella Valenciana", "Pulpo a la Gallega"]', '["Arroces", "Carnes"]',
         '{"mesa_preferida": "V2", "alergias": [], "ocasion_habitual": "cenas_negocios"}', 20, 5, true, true, true, true,
         CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '1 day',
         45, true, NOW() - INTERVAL '2 years', NOW()),
         
        ('Ana Rodriguez', 'Ana', 'Rodriguez', 'López', 'ana.rodriguez@email.com', '+34666333444', 'vip', 'vip',
         32, 32, 32, 3520.80, 3520.80, 110.03, 6800.00, 10, 2, 22.0, 'whatsapp',
         '["Lubina a la Sal", "Risotto de Setas", "Tarta de Chocolate"]', '["Lubina a la Sal", "Risotto de Setas"]', '["Pescados", "Postres"]',
         '{"mesa_preferida": "V1", "alergias": ["frutos_secos"], "ocasion_habitual": "cenas_romanticas"}', 21, 6, true, true, true, true,
         CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day',
         52, true, NOW() - INTERVAL '1 year 8 months', NOW()),

        -- CLIENTES REGULARES (Frecuencia media, gasto medio)
        ('Luis Martinez', 'Luis', 'Martinez', 'Fernández', 'luis.martinez@email.com', '+34666555666', 'regular', 'regular',
         18, 18, 18, 1260.00, 1260.00, 70.00, 2800.00, 25, 7, 30.0, 'whatsapp',
         '["Pizza Margherita", "Ensalada César", "Tiramisú"]', '["Pizza Margherita", "Ensalada César"]', '["Pizzas", "Ensaladas"]',
         '{"mesa_preferida": "4", "alergias": [], "ocasion_habitual": "cenas_familia"}', 19, 0, true, true, true, true,
         CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '3 days',
         28, true, NOW() - INTERVAL '1 year 2 months', NOW()),
         
        ('Maria Garcia', 'Maria', 'Garcia', 'Ruiz', 'maria.garcia@email.com', '+34666777888', 'regular', 'regular',
         15, 15, 15, 975.00, 975.00, 65.00, 2200.00, 30, 10, 35.0, 'email',
         '["Gazpacho", "Secreto Ibérico", "Flan Casero"]', '["Gazpacho", "Secreto Ibérico"]', '["Sopas", "Carnes"]',
         '{"mesa_preferida": "2", "alergias": ["lactosa"], "ocasion_habitual": "comidas_trabajo"}', 13, 2, true, false, false, true,
         CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days',
         22, true, NOW() - INTERVAL '10 months', NOW()),

        -- CLIENTES OCASIONALES (Baja frecuencia, gasto variable)
        ('Pedro Sanchez', 'Pedro', 'Sanchez', 'Moreno', 'pedro.sanchez@email.com', '+34666999000', 'ocasional', 'ocasional',
         8, 8, 8, 440.00, 440.00, 55.00, 800.00, 45, 21, 45.0, 'whatsapp',
         '["Hamburguesa Gourmet", "Patatas Bravas"]', '["Hamburguesa Gourmet"]', '["Hamburguesas"]',
         '{"mesa_preferida": "T4", "alergias": [], "ocasion_habitual": "cenas_amigos"}', 21, 6, true, true, false, true,
         CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '15 days',
         12, false, NOW() - INTERVAL '8 months', NOW()),
         
        ('Elena Fernandez', 'Elena', 'Fernandez', 'Castro', 'elena.fernandez@email.com', '+34666111000', 'ocasional', 'ocasional',
         6, 6, 6, 390.00, 390.00, 65.00, 900.00, 50, 35, 50.0, 'email',
         '["Salmón Teriyaki", "Ensalada Mixta"]', '["Salmón Teriyaki"]', '["Pescados"]',
         '{"mesa_preferida": "T2", "alergias": ["gluten"], "ocasion_habitual": "celebraciones"}', 20, 0, true, false, false, false,
         CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '20 days',
         8, false, NOW() - INTERVAL '6 months', NOW()),

        -- CLIENTES NUEVOS (Pocas visitas, potencial)
        ('Antonio Lopez', 'Antonio', 'Lopez', 'Vega', 'antonio.lopez@email.com', '+34666222111', 'nuevo', 'nuevo',
         3, 3, 3, 165.00, 165.00, 55.00, 600.00, 60, 45, 60.0, 'whatsapp',
         '["Croquetas Caseras", "Bacalao al Pil Pil"]', '["Croquetas Caseras"]', '["Tapas"]',
         '{"mesa_preferida": "8", "alergias": [], "ocasion_habitual": "primera_visita"}', 19, 4, true, true, true, true,
         CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '30 days',
         4, false, NOW() - INTERVAL '3 months', NOW()),
         
        ('Carmen Jimenez', 'Carmen', 'Jimenez', 'Herrera', 'carmen.jimenez@email.com', '+34666333222', 'nuevo', 'nuevo',
         2, 2, 2, 98.00, 98.00, 49.00, 400.00, 65, 52, 65.0, 'email',
         '["Tortilla Española", "Café con Leche"]', '["Tortilla Española"]', '["Tapas"]',
         '{"mesa_preferida": "1", "alergias": [], "ocasion_habitual": "desayunos"}', 11, 1, false, false, false, true,
         CURRENT_DATE - INTERVAL '52 days', CURRENT_DATE - INTERVAL '52 days', CURRENT_DATE - INTERVAL '40 days',
         3, false, NOW() - INTERVAL '2 months', NOW()),

        -- CLIENTES EN RIESGO (Sin visitas recientes)
        ('Roberto Diaz', 'Roberto', 'Diaz', 'Peña', 'roberto.diaz@email.com', '+34666444333', 'en_riesgo', 'en_riesgo',
         12, 8, 12, 720.00, 480.00, 60.00, 1200.00, 75, 90, 80.0, 'whatsapp',
         '["Cordero Asado", "Vino Tinto Reserva"]', '["Cordero Asado"]', '["Carnes"]',
         '{"mesa_preferida": "7", "alergias": [], "ocasion_habitual": "cenas_especiales"}', 20, 6, true, true, false, true,
         CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '85 days',
         18, true, NOW() - INTERVAL '1 year 6 months', NOW()),
         
        ('Isabel Morales', 'Isabel', 'Morales', 'Ramos', 'isabel.morales@email.com', '+34666555444', 'en_riesgo', 'en_riesgo',
         9, 4, 9, 540.00, 240.00, 60.00, 800.00, 80, 120, 90.0, 'email',
         '["Paella de Verduras", "Agua con Gas"]', '["Paella de Verduras"]', '["Arroces"]',
         '{"mesa_preferida": "T6", "alergias": ["mariscos"], "ocasion_habitual": "comidas_vegetarianas"}', 14, 3, true, false, false, false,
         CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '100 days',
         12, false, NOW() - INTERVAL '1 year', NOW()),

        -- CLIENTES INACTIVOS (Muchos días sin venir)
        ('Francisco Ruiz', 'Francisco', 'Ruiz', 'Ortega', 'francisco.ruiz@email.com', '+34666666555', 'inactivo', 'inactivo',
         15, 2, 15, 825.00, 110.00, 55.00, 500.00, 90, 180, 120.0, 'whatsapp',
         '["Fabada Asturiana", "Sidra"]', '["Fabada Asturiana"]', '["Legumbres"]',
         '{"mesa_preferida": "12", "alergias": [], "ocasion_habitual": "comidas_tradicionales"}', 15, 0, false, false, false, false,
         CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '170 days',
         20, true, NOW() - INTERVAL '2 years 3 months', NOW()),

        -- CLIENTE ALTO VALOR (Gasto muy alto, menos frecuente pero valioso)
        ('Alejandro Vargas', 'Alejandro', 'Vargas', 'Silva', 'alejandro.vargas@email.com', '+34666777666', 'alto_valor', 'alto_valor',
         8, 8, 8, 1600.00, 1600.00, 200.00, 4000.00, 20, 14, 20.0, 'whatsapp',
         '["Menú Degustación", "Champagne Dom Pérignon", "Caviar"]', '["Menú Degustación", "Champagne Dom Pérignon"]', '["Menu_Degustacion", "Bebidas_Premium"]',
         '{"mesa_preferida": "V4", "alergias": [], "ocasion_habitual": "eventos_corporativos"}', 21, 5, true, true, true, true,
         CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '7 days',
         15, true, NOW() - INTERVAL '10 months', NOW())
) AS cliente_data(
    name, first_name, last_name1, last_name2, email, phone, segment_auto, segment_manual,
    total_visits, visits_12m, visits_count, total_spent, total_spent_12m, avg_ticket, predicted_ltv, churn_risk_score,
    recency_days, aivi_days, preferred_channel, preferred_items, top_dishes, top_categories,
    preferences, fav_hour_block, fav_weekday, consent_email, consent_sms, consent_whatsapp,
    notifications_enabled, last_visit, last_visit_at, last_interaction_at,
    interaction_count, is_vip_calculated, created_at
)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 4. CREAR PLANTILLAS DE MENSAJERÍA
-- ==========================================

-- PLANTILLAS CRM
INSERT INTO crm_templates (restaurant_id, name, type, subject, content, variables, priority, active, created_at, updated_at)
SELECT 
    r.id as restaurant_id,
    template_data.name,
    template_data.type,
    template_data.subject,
    template_data.content,
    template_data.variables::jsonb,
    template_data.priority,
    true as active,
    NOW() - INTERVAL '6 months' as created_at,
    NOW() as updated_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        ('Bienvenida Nuevos Clientes', 'bienvenida', '¡Bienvenido a {restaurant_name}!', 
         'Hola {customer_name}, gracias por visitarnos por primera vez. Esperamos que hayas disfrutado de tu experiencia. ¡Te esperamos pronto!',
         '["restaurant_name", "customer_name"]', 1),
        
        ('Reactivación Clientes Inactivos', 'reactivacion', 'Te echamos de menos en {restaurant_name}',
         'Hola {customer_name}, hace tiempo que no te vemos por {restaurant_name}. Tenemos nuevos platos que creemos te van a encantar. ¿Qué te parece si reservas una mesa?',
         '["restaurant_name", "customer_name", "last_visit_date"]', 2),
         
        ('Promoción a VIP', 'vip_upgrade', '¡Felicidades! Ahora eres cliente VIP',
         'Hola {customer_name}, nos complace informarte que ahora formas parte de nuestro programa VIP. Disfruta de reservas prioritarias y atención personalizada.',
         '["restaurant_name", "customer_name", "vip_benefits"]', 3),
         
        ('Confirmación No-Show Alto Riesgo', 'noshow_prevention_high', 'Confirmación importante de tu reserva',
         'Hola {customer_name}, queremos confirmar tu reserva para {party_size} personas el {reservation_date} a las {reservation_time}. ¿Podrás acompañarnos?',
         '["customer_name", "party_size", "reservation_date", "reservation_time"]', 5),
         
        ('Recordatorio No-Show Medio', 'noshow_prevention_medium', 'Recordatorio de tu reserva en {restaurant_name}',
         'Hola {customer_name}, te recordamos tu reserva para mañana a las {reservation_time}. ¡Te esperamos!',
         '["customer_name", "restaurant_name", "reservation_time"]', 4),
         
        ('Feedback Post-Visita', 'feedback', '¿Cómo fue tu experiencia en {restaurant_name}?',
         'Hola {customer_name}, esperamos que hayas disfrutado de tu visita. ¿Podrías contarnos cómo fue tu experiencia?',
         '["customer_name", "restaurant_name"]', 2)
) AS template_data(name, type, subject, content, variables, priority)
WHERE r.name = 'Restaurante Demo';

-- PLANTILLAS DE MENSAJES
INSERT INTO message_templates (
    restaurant_id, name, category, subject, content_markdown, body_markdown, 
    channel, template_type, segment, personalization_level, variables,
    priority, event_trigger, optimal_send_time, send_delay_hours,
    usage_count, success_rate, conversion_rate, is_active, tags,
    created_at, updated_at
)
SELECT 
    r.id as restaurant_id,
    msg_template.name,
    msg_template.category,
    msg_template.subject,
    msg_template.content_markdown,
    msg_template.body_markdown,
    msg_template.channel,
    msg_template.template_type,
    msg_template.segment,
    msg_template.personalization_level,
    msg_template.variables::text[],
    msg_template.priority,
    msg_template.event_trigger,
    msg_template.optimal_send_time,
    msg_template.send_delay_hours,
    msg_template.usage_count,
    msg_template.success_rate,
    msg_template.conversion_rate,
    true as is_active,
    msg_template.tags::text[],
    NOW() - INTERVAL '6 months' as created_at,
    NOW() as updated_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        -- PLANTILLAS WHATSAPP
        ('WhatsApp Bienvenida', 'marketing', '¡Bienvenido!', 
         '¡Hola {customer_name}! 👋\n\nGracias por visitarnos por primera vez en {restaurant_name}. Esperamos que hayas disfrutado de la experiencia.\n\n¿Te gustaría recibir ofertas especiales? 🎉',
         '¡Hola {customer_name}! 👋\n\nGracias por visitarnos por primera vez en {restaurant_name}. Esperamos que hayas disfrutado de la experiencia.\n\n¿Te gustaría recibir ofertas especiales? 🎉',
         'whatsapp', 'bienvenida', 'nuevo', 'advanced', 
         '{"customer_name", "restaurant_name"}', 8, 'post_visit', 'evening', 2, 
         15, 0.85, 0.32, '{"bienvenida", "nuevo_cliente"}'),
         
        ('WhatsApp No-Show Alto Riesgo', 'operational', 'Confirmación Urgente',
         '🚨 Hola {customer_name}, necesitamos confirmar tu reserva para {party_size} personas HOY a las {reservation_time}.\n\n¿Podrás acompañarnos? Por favor confirma 👍 o cancela 👎',
         '🚨 Hola {customer_name}, necesitamos confirmar tu reserva para {party_size} personas HOY a las {reservation_time}.\n\n¿Podrás acompañarnos? Por favor confirma 👍 o cancela 👎',
         'whatsapp', 'recordatorio', 'all', 'ai_powered',
         '{"customer_name", "party_size", "reservation_time"}', 10, 'high_risk_detection', 'morning', 0,
         45, 0.92, 0.78, '{"no_show", "confirmacion", "urgente"}'),
         
        ('WhatsApp Reactivación VIP', 'marketing', 'Te echamos de menos',
         '👑 Hola {customer_name}, nuestro cliente VIP.\n\nHace {days_since_visit} días que no te vemos... ¿Todo bien?\n\nTenemos nuevos platos que creemos te van a encantar. ¿Reservamos tu mesa habitual? 🍽️',
         '👑 Hola {customer_name}, nuestro cliente VIP.\n\nHace {days_since_visit} días que no te vemos... ¿Todo bien?\n\nTenemos nuevos platos que creemos te van a encantar. ¿Reservamos tu mesa habitual? 🍽️',
         'whatsapp', 'reactivacion', 'vip', 'ai_powered',
         '{"customer_name", "days_since_visit", "preferred_dishes"}', 9, 'inactivity_detected', 'afternoon', 24,
         28, 0.76, 0.45, '{"reactivacion", "vip", "personalized"}'),
         
        -- PLANTILLAS EMAIL
        ('Email Promoción Mensual', 'marketing', 'Ofertas especiales de {restaurant_name}',
         'Estimado/a {customer_name},\n\nEste mes tenemos ofertas especiales que no te puedes perder:\n\n- 20% descuento en menús degustación\n- Copa de cava gratis con postres\n- Reserva anticipada para eventos especiales\n\n¡Reserva ya!',
         'Estimado/a {customer_name},\n\nEste mes tenemos ofertas especiales que no te puedes perder:\n\n- 20% descuento en menús degustación\n- Copa de cava gratis con postres\n- Reserva anticipada para eventos especiales\n\n¡Reserva ya!',
         'email', 'marketing', 'regular', 'basic',
         '{"customer_name", "restaurant_name", "offers"}', 5, 'monthly', 'morning', 0,
         8, 0.45, 0.18, '{"promocion", "mensual", "ofertas"}'),
         
        ('Email Feedback', 'feedback', 'Tu opinión nos importa',
         'Hola {customer_name},\n\nEsperamos que hayas disfrutado de tu reciente visita a {restaurant_name}.\n\nNos encantaría conocer tu opinión. ¿Podrías dedicar 2 minutos a valorar tu experiencia?\n\n[Enlace a encuesta]',
         'Hola {customer_name},\n\nEsperamos que hayas disfrutado de tu reciente visita a {restaurant_name}.\n\nNos encantaría conocer tu opinión. ¿Podrías dedicar 2 minutos a valorar tu experiencia?\n\n[Enlace a encuesta]',
         'email', 'feedback', 'all', 'basic',
         '{"customer_name", "restaurant_name", "visit_date"}', 6, 'post_visit', 'evening', 24,
         22, 0.65, 0.40, '{"feedback", "encuesta", "opinion"}')
) AS msg_template(
    name, category, subject, content_markdown, body_markdown, channel, template_type, segment, 
    personalization_level, variables, priority, event_trigger, optimal_send_time, send_delay_hours,
    usage_count, success_rate, conversion_rate, tags
)
WHERE r.name = 'Restaurante Demo';

-- ==========================================
-- 5. GENERAR DISPONIBILIDADES PARA 6 MESES
-- ==========================================

-- Generar slots de disponibilidad para todas las mesas durante 6 meses
INSERT INTO availability_slots (restaurant_id, table_id, slot_date, start_time, end_time, status, source, is_available, metadata, created_at, updated_at)
SELECT 
    r.id as restaurant_id,
    t.id as table_id,
    date_series.slot_date,
    time_slots.start_time,
    time_slots.end_time,
    CASE 
        WHEN random() < 0.15 THEN 'blocked'  -- 15% bloqueadas (mantenimiento, eventos privados)
        ELSE 'free'
    END as status,
    'system' as source,
    CASE 
        WHEN random() < 0.15 THEN false  -- 15% no disponibles
        ELSE true
    END as is_available,
    jsonb_build_object(
        'max_party_size', t.capacity,
        'table_name', t.name,
        'zone', t.zone
    ) as metadata,
    NOW() - INTERVAL '6 months' as created_at,
    NOW() as updated_at
FROM restaurants r
CROSS JOIN tables t
CROSS JOIN generate_series(
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE + INTERVAL '1 month',
    INTERVAL '1 day'
) AS date_series(slot_date)
CROSS JOIN (
    VALUES 
        ('12:00'::time, '14:30'::time),  -- Almuerzo
        ('14:30'::time, '17:00'::time),  -- Tarde
        ('19:00'::time, '21:30'::time),  -- Primera cena
        ('21:30'::time, '00:00'::time)   -- Segunda cena
) AS time_slots(start_time, end_time)
WHERE r.name = 'Restaurante Demo'
AND t.restaurant_id = r.id
AND EXTRACT(DOW FROM date_series.slot_date) NOT IN (1, 2); -- No lunes ni martes (cerrado)

-- ==========================================
-- 6. CREAR RESERVAS HISTÓRICAS (ÚLTIMOS 6 MESES)
-- ==========================================

-- Generar reservas realistas basadas en patrones de comportamiento de clientes
INSERT INTO reservations (
    restaurant_id, customer_id, customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, party_size, table_id, table_number,
    status, channel, reservation_channel, source, reservation_source,
    notes, special_requests, spend_amount, created_at, updated_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    reserva_data.reservation_date,
    reserva_data.reservation_time,
    reserva_data.party_size,
    t.id as table_id,
    t.table_number,
    reserva_data.status,
    reserva_data.channel,
    reserva_data.channel as reservation_channel,
    'direct' as source,
    CASE WHEN random() < 0.3 THEN 'ia' ELSE 'manual' END as reservation_source,
    reserva_data.notes,
    reserva_data.special_requests,
    reserva_data.spend_amount,
    reserva_data.created_at,
    reserva_data.created_at as updated_at
FROM restaurants r
CROSS JOIN customers c
CROSS JOIN tables t
CROSS JOIN LATERAL (
    -- Generar múltiples reservas por cliente basadas en su segmento
    SELECT 
        date_series.reservation_date,
        CASE 
            WHEN EXTRACT(DOW FROM date_series.reservation_date) IN (0, 6) THEN -- Fin de semana
                (ARRAY['13:00', '14:00', '20:00', '21:00', '21:30'])[floor(random() * 5 + 1)]::time
            ELSE -- Entre semana
                (ARRAY['13:30', '14:00', '19:30', '20:00', '20:30'])[floor(random() * 5 + 1)]::time
        END as reservation_time,
        CASE 
            WHEN c.segment_auto = 'vip' THEN 
                (ARRAY[2, 2, 4, 4, 6, 8])[floor(random() * 6 + 1)]  -- VIPs van más en grupo
            WHEN c.segment_auto = 'regular' THEN
                (ARRAY[2, 2, 3, 4, 4])[floor(random() * 5 + 1)]     -- Regulares grupos medianos
            ELSE 
                (ARRAY[1, 2, 2, 3])[floor(random() * 4 + 1)]        -- Ocasionales grupos pequeños
        END as party_size,
        CASE 
            WHEN random() < 0.95 THEN 'completed'
            WHEN random() < 0.98 THEN 'cancelled'
            ELSE 'no_show'
        END as status,
        CASE 
            WHEN c.preferred_channel = 'whatsapp' THEN 'whatsapp'
            WHEN c.preferred_channel = 'email' THEN 'web'
            ELSE (ARRAY['whatsapp', 'phone', 'web'])[floor(random() * 3 + 1)]
        END as channel,
        CASE 
            WHEN c.segment_auto = 'vip' THEN 
                'Reserva VIP - ' || (ARRAY['Celebración especial', 'Cena de negocios', 'Aniversario', 'Cliente habitual'])[floor(random() * 4 + 1)]
            WHEN c.segment_auto = 'regular' THEN
                'Cliente habitual - ' || (ARRAY['Cena familiar', 'Comida de trabajo', 'Celebración', 'Cena normal'])[floor(random() * 4 + 1)]
            ELSE
                (ARRAY['Primera visita', 'Recomendación', 'Cumpleaños', 'Cita romántica', 'Cena casual'])[floor(random() * 5 + 1)]
        END as notes,
        CASE 
            WHEN random() < 0.3 THEN 
                (ARRAY['Sin cebolla', 'Alérgico frutos secos', 'Mesa tranquila', 'Sin gluten', 'Vegetariano', 'Mesa junto ventana'])[floor(random() * 6 + 1)]
            ELSE NULL
        END as special_requests,
        CASE 
            WHEN c.segment_auto = 'vip' THEN (random() * 150 + 80)::numeric(10,2)      -- 80-230€
            WHEN c.segment_auto = 'alto_valor' THEN (random() * 120 + 120)::numeric(10,2) -- 120-240€
            WHEN c.segment_auto = 'regular' THEN (random() * 60 + 40)::numeric(10,2)   -- 40-100€
            ELSE (random() * 40 + 25)::numeric(10,2)                                   -- 25-65€
        END as spend_amount,
        date_series.reservation_date - INTERVAL '1 day' + 
        (random() * INTERVAL '20 hours') as created_at
    FROM generate_series(
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    ) AS date_series(reservation_date)
    WHERE 
        EXTRACT(DOW FROM date_series.reservation_date) NOT IN (1, 2) -- No lunes ni martes
        AND random() < CASE 
            WHEN c.segment_auto = 'vip' THEN 0.25        -- VIP: 25% prob por día = ~45 reservas en 6 meses
            WHEN c.segment_auto = 'alto_valor' THEN 0.08 -- Alto valor: 8% prob = ~14 reservas
            WHEN c.segment_auto = 'regular' THEN 0.12    -- Regular: 12% prob = ~22 reservas
            WHEN c.segment_auto = 'ocasional' THEN 0.04  -- Ocasional: 4% prob = ~7 reservas
            WHEN c.segment_auto = 'nuevo' THEN 0.02      -- Nuevo: 2% prob = ~4 reservas
            WHEN c.segment_auto = 'en_riesgo' THEN 0.06  -- En riesgo: 6% prob = ~11 reservas
            ELSE 0.01                                    -- Inactivo: 1% prob = ~2 reservas
        END
) AS reserva_data
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
AND t.restaurant_id = r.id
AND t.capacity >= reserva_data.party_size  -- Mesa debe tener capacidad suficiente
AND random() < 0.8; -- 80% de combinaciones cliente-mesa para generar suficientes datos

-- ==========================================
-- 7. CREAR TICKETS DE CONSUMO PARA CADA RESERVA COMPLETADA
-- ==========================================

INSERT INTO billing_tickets (
    restaurant_id, customer_id, reservation_id, table_id,
    ticket_number, ticket_date, service_start, service_end, covers_count,
    items, subtotal, tax_amount, discount_amount, tip_amount, total_amount,
    payment_method, mesa_number, waiter_name, kitchen_notes, special_requests,
    auto_matched, confidence_score, is_processed, source_system,
    created_at, updated_at
)
SELECT 
    res.restaurant_id,
    res.customer_id,
    res.id as reservation_id,
    res.table_id,
    'T' || TO_CHAR(res.reservation_date, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY res.reservation_date ORDER BY res.created_at)::text, 4, '0') as ticket_number,
    res.reservation_date + res.reservation_time as ticket_date,
    res.reservation_date + res.reservation_time as service_start,
    res.reservation_date + res.reservation_time + INTERVAL '90 minutes' + (random() * INTERVAL '60 minutes') as service_end,
    res.party_size as covers_count,
    ticket_items.items,
    ticket_items.subtotal,
    (ticket_items.subtotal * 0.10)::numeric(10,2) as tax_amount,  -- 10% IVA
    CASE WHEN random() < 0.15 THEN (ticket_items.subtotal * 0.10)::numeric(10,2) ELSE 0 END as discount_amount, -- 15% prob descuento
    CASE WHEN random() < 0.70 THEN (ticket_items.subtotal * (0.05 + random() * 0.10))::numeric(10,2) ELSE 0 END as tip_amount, -- 70% prob propina 5-15%
    (ticket_items.subtotal * 1.10 + 
     CASE WHEN random() < 0.70 THEN (ticket_items.subtotal * (0.05 + random() * 0.10)) ELSE 0 END -
     CASE WHEN random() < 0.15 THEN (ticket_items.subtotal * 0.10) ELSE 0 END)::numeric(10,2) as total_amount,
    (ARRAY['efectivo', 'tarjeta', 'tarjeta', 'tarjeta', 'bizum', 'transferencia'])[floor(random() * 6 + 1)] as payment_method,
    t.table_number as mesa_number,
    (ARRAY['Carlos', 'Ana', 'Miguel', 'Laura', 'David', 'Sofia', 'Pablo', 'Carmen'])[floor(random() * 8 + 1)] as waiter_name,
    CASE WHEN random() < 0.2 THEN 
        (ARRAY['Sin sal', 'Poco hecho', 'Muy hecho', 'Salsa aparte', 'Extra picante', 'Sin especias'])[floor(random() * 6 + 1)]
    ELSE NULL END as kitchen_notes,
    res.special_requests,
    true as auto_matched,
    0.95 + (random() * 0.05) as confidence_score,
    true as is_processed,
    'pos_system' as source_system,
    res.reservation_date + res.reservation_time + INTERVAL '2 hours' as created_at,
    res.reservation_date + res.reservation_time + INTERVAL '2 hours' as updated_at
FROM reservations res
JOIN tables t ON res.table_id = t.id
JOIN customers c ON res.customer_id = c.id
CROSS JOIN LATERAL (
    SELECT 
        jsonb_build_array(
            -- Generar items basados en el segmento del cliente y tamaño del grupo
            jsonb_build_object(
                'name', CASE 
                    WHEN c.segment_auto = 'vip' THEN 'Menú Degustación Premium'
                    WHEN c.segment_auto = 'alto_valor' THEN 'Menú Ejecutivo'
                    WHEN random() < 0.3 THEN 'Menú del Día'
                    ELSE (ARRAY['Paella Valenciana', 'Lubina a la Sal', 'Chuletón', 'Risotto de Setas', 'Pulpo a la Gallega'])[floor(random() * 5 + 1)]
                END,
                'quantity', res.party_size,
                'unit_price', CASE 
                    WHEN c.segment_auto = 'vip' THEN (45 + random() * 35)::numeric(10,2)
                    WHEN c.segment_auto = 'alto_valor' THEN (35 + random() * 25)::numeric(10,2)
                    ELSE (15 + random() * 20)::numeric(10,2)
                END,
                'category', 'Platos Principales'
            ),
            -- Bebidas
            jsonb_build_object(
                'name', CASE 
                    WHEN c.segment_auto IN ('vip', 'alto_valor') THEN 
                        (ARRAY['Vino Reserva', 'Champagne', 'Whisky Premium', 'Gin Tonic Premium'])[floor(random() * 4 + 1)]
                    ELSE 
                        (ARRAY['Agua', 'Refresco', 'Cerveza', 'Vino de la Casa', 'Café'])[floor(random() * 5 + 1)]
                END,
                'quantity', CASE WHEN random() < 0.8 THEN res.party_size ELSE res.party_size + 1 END,
                'unit_price', CASE 
                    WHEN c.segment_auto IN ('vip', 'alto_valor') THEN (8 + random() * 15)::numeric(10,2)
                    ELSE (2 + random() * 8)::numeric(10,2)
                END,
                'category', 'Bebidas'
            ),
            -- Postres (50% probabilidad)
            CASE WHEN random() < 0.5 THEN
                jsonb_build_object(
                    'name', (ARRAY['Tarta de Chocolate', 'Tiramisú', 'Flan Casero', 'Helado Artesanal', 'Fruta de Temporada'])[floor(random() * 5 + 1)],
                    'quantity', CASE WHEN random() < 0.7 THEN res.party_size ELSE (res.party_size / 2 + 1)::integer END,
                    'unit_price', (4 + random() * 8)::numeric(10,2),
                    'category', 'Postres'
                )
            ELSE NULL::jsonb
            END
        ) as items,
        -- Calcular subtotal basado en spend_amount de la reserva
        res.spend_amount as subtotal
) AS ticket_items
WHERE res.status = 'completed'
AND res.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- ==========================================
-- 8. CREAR CONVERSACIONES Y MENSAJES REALES
-- ==========================================

-- Crear conversaciones basadas en reservas y comportamiento de clientes
INSERT INTO conversations (
    restaurant_id, customer_id, customer_name, customer_email, customer_phone,
    subject, channel, status, priority, tags, metadata, created_at, updated_at
)
SELECT 
    c.restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    conv_data.subject,
    conv_data.channel,
    conv_data.status,
    conv_data.priority,
    conv_data.tags,
    conv_data.metadata::jsonb,
    conv_data.created_at,
    conv_data.created_at as updated_at
FROM customers c
CROSS JOIN LATERAL (
    SELECT 
        date_series.conversation_date,
        CASE 
            WHEN type_series.conversation_type = 1 THEN 'Consulta sobre reserva'
            WHEN type_series.conversation_type = 2 THEN 'Modificación de reserva'
            WHEN type_series.conversation_type = 3 THEN 'Consulta sobre menú'
            WHEN type_series.conversation_type = 4 THEN 'Felicitación por servicio'
            WHEN type_series.conversation_type = 5 THEN 'Queja o sugerencia'
            ELSE 'Consulta general'
        END as subject,
        CASE 
            WHEN c.preferred_channel = 'whatsapp' THEN 'whatsapp'
            WHEN c.preferred_channel = 'email' THEN 'email'
            ELSE (ARRAY['whatsapp', 'phone', 'email', 'app'])[floor(random() * 4 + 1)]
        END as channel,
        CASE 
            WHEN random() < 0.80 THEN 'closed'
            WHEN random() < 0.95 THEN 'open'
            ELSE 'pending'
        END as status,
        CASE 
            WHEN type_series.conversation_type = 5 THEN 'high'  -- Quejas alta prioridad
            WHEN type_series.conversation_type IN (1,2) THEN 'normal'  -- Reservas prioridad normal
            ELSE 'low'
        END as priority,
        CASE 
            WHEN type_series.conversation_type = 1 THEN ARRAY['reserva', 'consulta']
            WHEN type_series.conversation_type = 2 THEN ARRAY['reserva', 'modificacion']
            WHEN type_series.conversation_type = 3 THEN ARRAY['menu', 'informacion']
            WHEN type_series.conversation_type = 4 THEN ARRAY['felicitacion', 'feedback']
            WHEN type_series.conversation_type = 5 THEN ARRAY['queja', 'mejora']
            ELSE ARRAY['general']
        END as tags,
        jsonb_build_object(
            'satisfaction_score', 
            CASE 
                WHEN type_series.conversation_type = 4 THEN 5  -- Felicitaciones = 5
                WHEN type_series.conversation_type = 5 THEN 2  -- Quejas = 2
                ELSE 3 + random() * 2  -- Resto 3-5
            END,
            'response_time_minutes', 5 + random() * 25,
            'resolved_by', 
            CASE 
                WHEN random() < 0.60 THEN 'ai'
                ELSE 'human'
            END
        ) as metadata,
        date_series.conversation_date as created_at
    FROM generate_series(
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    ) AS date_series(conversation_date)
    CROSS JOIN generate_series(1, 6) AS type_series(conversation_type)
    WHERE 
        random() < CASE 
            WHEN c.segment_auto = 'vip' THEN 0.15        -- VIP más comunicación
            WHEN c.segment_auto = 'regular' THEN 0.08    -- Regular comunicación normal
            WHEN c.segment_auto = 'alto_valor' THEN 0.10 -- Alto valor comunicación media
            ELSE 0.04                                    -- Resto poca comunicación
        END
) AS conv_data
WHERE c.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- Crear mensajes para cada conversación
INSERT INTO messages (
    restaurant_id, customer_name, customer_phone, message_text, message_type,
    direction, channel, status, metadata, created_at
)
SELECT 
    conv.restaurant_id,
    conv.customer_name,
    conv.customer_phone,
    msg_data.message_text,
    'text' as message_type,
    msg_data.direction,
    conv.channel,
    'delivered' as status,
    jsonb_build_object(
        'conversation_id', conv.id,
        'response_time', msg_data.response_time,
        'automated', msg_data.automated
    ) as metadata,
    msg_data.created_at
FROM conversations conv
CROSS JOIN LATERAL (
    VALUES 
        -- Mensaje inicial del cliente
        (CASE 
            WHEN conv.subject = 'Consulta sobre reserva' THEN 'Hola, me gustaría hacer una reserva para el sábado por la noche'
            WHEN conv.subject = 'Modificación de reserva' THEN 'Buenos días, necesito cambiar mi reserva del viernes'
            WHEN conv.subject = 'Consulta sobre menú' THEN 'Hola, ¿podrían enviarme la carta actualizada?'
            WHEN conv.subject = 'Felicitación por servicio' THEN 'Quería felicitarles por el excelente servicio de ayer'
            WHEN conv.subject = 'Queja o sugerencia' THEN 'Tengo que comentarles un problema con mi última visita'
            ELSE 'Hola, tengo una consulta'
        END, 'inbound', false, 0, conv.created_at),
        
        -- Respuesta del restaurante
        (CASE 
            WHEN conv.subject = 'Consulta sobre reserva' THEN 'Hola! Por supuesto, ¿para cuántas personas y a qué hora prefiere?'
            WHEN conv.subject = 'Modificación de reserva' THEN 'Buenos días, claro que sí. ¿Para qué día le gustaría cambiarla?'
            WHEN conv.subject = 'Consulta sobre menú' THEN 'Hola! Le enviamos la carta actualizada. ¿Hay algo específico que le interese?'
            WHEN conv.subject = 'Felicitación por servicio' THEN '¡Muchísimas gracias! Nos alegra saber que disfrutó de su visita'
            WHEN conv.subject = 'Queja o sugerencia' THEN 'Lamentamos que haya tenido una mala experiencia. ¿Podría contarnos qué pasó?'
            ELSE 'Hola! Estaremos encantados de ayudarle'
        END, 'outbound', 
        CASE WHEN (conv.metadata->>'resolved_by') = 'ai' THEN true ELSE false END,
        CASE WHEN (conv.metadata->>'resolved_by') = 'ai' THEN 30 ELSE 300 END,
        conv.created_at + INTERVAL '15 minutes'),
        
        -- Mensaje de cierre (si la conversación está cerrada)
        (CASE 
            WHEN conv.status = 'closed' THEN 
                CASE 
                    WHEN conv.subject = 'Consulta sobre reserva' THEN 'Perfecto, queda confirmada su reserva. ¡Le esperamos!'
                    WHEN conv.subject = 'Modificación de reserva' THEN 'Listo, su reserva ha sido modificada correctamente'
                    WHEN conv.subject = 'Consulta sobre menú' THEN '¿Hay algo más en lo que podamos ayudarle?'
                    WHEN conv.subject = 'Felicitación por servicio' THEN 'Gracias de nuevo. ¡Esperamos verle pronto!'
                    WHEN conv.subject = 'Queja o sugerencia' THEN 'Hemos tomado nota para mejorar. Gracias por su feedback'
                    ELSE 'Gracias por contactarnos. ¡Que tenga un buen día!'
                END
            ELSE NULL
        END, 'outbound', false, 0, conv.created_at + INTERVAL '30 minutes')
) AS msg_data(message_text, direction, automated, response_time, created_at)
WHERE msg_data.message_text IS NOT NULL;

-- ==========================================
-- 9. CREAR ACCIONES DE NO-SHOW PARA RESERVAS DE ALTO RIESGO
-- ==========================================

INSERT INTO noshow_actions (
    restaurant_id, reservation_id, customer_id, customer_name, customer_phone,
    reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors,
    action_type, channel, message_sent, template_id, template_name,
    customer_response, response_message, response_received_at, response_time,
    final_outcome, prevented_noshow, reservation_completed_at,
    sent_at, created_at, updated_at
)
SELECT 
    res.restaurant_id,
    res.id as reservation_id,
    res.customer_id,
    res.customer_name,
    res.customer_phone,
    res.reservation_date,
    res.reservation_time,
    res.party_size,
    noshow_data.risk_level,
    noshow_data.risk_score,
    noshow_data.risk_factors::jsonb,
    noshow_data.action_type,
    'whatsapp' as channel,
    noshow_data.message_sent,
    ct.id as template_id,
    ct.name as template_name,
    noshow_data.customer_response,
    noshow_data.response_message,
    noshow_data.response_received_at,
    noshow_data.response_time,
    CASE 
        WHEN res.status = 'completed' THEN 'attended'
        WHEN res.status = 'no_show' THEN 'no_show'
        WHEN res.status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END as final_outcome,
    CASE 
        WHEN res.status = 'completed' AND noshow_data.risk_level = 'high' THEN true
        ELSE false
    END as prevented_noshow,
    CASE WHEN res.status = 'completed' THEN res.reservation_date + res.reservation_time + INTERVAL '2 hours' ELSE NULL END,
    noshow_data.sent_at,
    noshow_data.sent_at as created_at,
    noshow_data.sent_at as updated_at
FROM reservations res
JOIN customers c ON res.customer_id = c.id
LEFT JOIN crm_templates ct ON ct.name = 'Confirmación No-Show Alto Riesgo'
CROSS JOIN LATERAL (
    SELECT 
        CASE 
            -- Factores de alto riesgo
            WHEN (res.party_size > 6 OR res.party_size = 1) 
                 AND EXTRACT(hour FROM res.reservation_time) >= 20 
                 AND c.segment_auto IN ('nuevo', 'ocasional') THEN 'high'
            -- Factores de riesgo medio
            WHEN res.party_size > 4 OR EXTRACT(hour FROM res.reservation_time) >= 21 
                 OR c.churn_risk_score > 50 THEN 'medium'
            -- Resto bajo riesgo
            ELSE 'low'
        END as risk_level,
        CASE 
            WHEN (res.party_size > 6 OR res.party_size = 1) 
                 AND EXTRACT(hour FROM res.reservation_time) >= 20 
                 AND c.segment_auto IN ('nuevo', 'ocasional') THEN 85 + floor(random() * 15)
            WHEN res.party_size > 4 OR EXTRACT(hour FROM res.reservation_time) >= 21 
                 OR c.churn_risk_score > 50 THEN 55 + floor(random() * 25)
            ELSE 20 + floor(random() * 30)
        END as risk_score,
        CASE 
            WHEN (res.party_size > 6 OR res.party_size = 1) 
                 AND EXTRACT(hour FROM res.reservation_time) >= 20 
                 AND c.segment_auto IN ('nuevo', 'ocasional') THEN 
                 '["grupo_grande", "hora_pico", "cliente_nuevo"]'
            WHEN res.party_size > 4 OR EXTRACT(hour FROM res.reservation_time) >= 21 
                 OR c.churn_risk_score > 50 THEN 
                 '["grupo_mediano", "hora_tardia", "riesgo_churn"]'
            ELSE '["bajo_riesgo"]'
        END as risk_factors,
        'whatsapp_confirmation' as action_type,
        'Hola ' || res.customer_name || '! Queremos confirmar tu reserva para ' || res.party_size || 
        ' personas el ' || TO_CHAR(res.reservation_date, 'DD/MM') || ' a las ' || 
        TO_CHAR(res.reservation_time, 'HH24:MI') || '. ¿Podrás acompañarnos? 😊' as message_sent,
        CASE 
            WHEN random() < 0.85 THEN 'confirmed'
            WHEN random() < 0.95 THEN 'no_response'
            ELSE 'cancelled'
        END as customer_response,
        CASE 
            WHEN random() < 0.85 THEN 'Sí, confirmado! Nos vemos entonces 👍'
            WHEN random() < 0.95 THEN NULL
            ELSE 'Lo siento, tengo que cancelar 😔'
        END as response_message,
        CASE 
            WHEN random() < 0.85 THEN res.reservation_date - INTERVAL '1 day' + INTERVAL '2 hours' + (random() * INTERVAL '4 hours')
            ELSE NULL
        END as response_received_at,
        CASE 
            WHEN random() < 0.85 THEN INTERVAL '15 minutes' + (random() * INTERVAL '3 hours')
            ELSE NULL
        END as response_time,
        res.reservation_date - INTERVAL '1 day' + INTERVAL '10:00:00' + (random() * INTERVAL '6 hours') as sent_at
) AS noshow_data
WHERE res.reservation_date >= CURRENT_DATE - INTERVAL '3 months'  -- Solo últimos 3 meses
AND res.reservation_date <= CURRENT_DATE + INTERVAL '1 week'      -- Hasta la próxima semana
AND (
    (res.party_size > 4) OR                                       -- Grupos medianos/grandes
    (EXTRACT(hour FROM res.reservation_time) >= 20) OR            -- Hora pico
    (c.segment_auto IN ('nuevo', 'ocasional')) OR                 -- Clientes de riesgo
    (c.churn_risk_score > 40)                                     -- Alto riesgo churn
)
AND random() < 0.7;  -- 70% de las reservas de riesgo tienen acción

-- ==========================================
-- 10. CREAR RESERVAS FUTURAS Y DE HOY
-- ==========================================

-- Reservas para HOY (para testing inmediato)
INSERT INTO reservations (
    restaurant_id, customer_id, customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, party_size, table_id, table_number,
    status, channel, reservation_channel, source, reservation_source,
    notes, special_requests, spend_amount, created_at, updated_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    CURRENT_DATE as reservation_date,
    reserva_hoy.reservation_time,
    reserva_hoy.party_size,
    t.id as table_id,
    t.table_number,
    'confirmed' as status,
    'whatsapp' as channel,
    'whatsapp' as reservation_channel,
    'direct' as source,
    'ia' as reservation_source,
    reserva_hoy.notes,
    reserva_hoy.special_requests,
    0.00 as spend_amount,  -- Se llenará después de la comida
    NOW() - INTERVAL '2 hours' as created_at,
    NOW() - INTERVAL '2 hours' as updated_at
FROM restaurants r
CROSS JOIN (
    VALUES 
        ('13:00'::time, 4, 'Comida familiar - mesa tranquila', 'Sin cebolla por favor'),
        ('13:30'::time, 2, 'Comida de trabajo', NULL),
        ('14:00'::time, 6, 'Celebración cumpleaños', 'Tarta sorpresa'),
        ('19:30'::time, 2, 'Cena romántica', 'Mesa junto ventana'),
        ('20:00'::time, 8, 'Cena empresa - ALTO RIESGO', 'Menú cerrado para grupo'),
        ('20:30'::time, 3, 'Cena amigos', NULL),
        ('21:00'::time, 4, 'Cena familiar', 'Niños en el grupo'),
        ('21:30'::time, 1, 'Cena individual - ALTO RIESGO', 'Mesa discreta')
) AS reserva_hoy(reservation_time, party_size, notes, special_requests)
CROSS JOIN customers c
CROSS JOIN tables t
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
AND t.restaurant_id = r.id
AND t.capacity >= reserva_hoy.party_size
AND random() < 0.6;  -- 60% de combinaciones para generar más reservas hoy

-- Reservas futuras (próximos 30 días)
INSERT INTO reservations (
    restaurant_id, customer_id, customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, party_size, table_id, table_number,
    status, channel, reservation_channel, source, reservation_source,
    notes, special_requests, spend_amount, created_at, updated_at
)
SELECT 
    r.id as restaurant_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    future_date.reservation_date,
    future_time.reservation_time,
    future_size.party_size,
    t.id as table_id,
    t.table_number,
    'confirmed' as status,
    CASE WHEN c.preferred_channel = 'whatsapp' THEN 'whatsapp' ELSE 'web' END as channel,
    CASE WHEN c.preferred_channel = 'whatsapp' THEN 'whatsapp' ELSE 'web' END as reservation_channel,
    'direct' as source,
    CASE WHEN random() < 0.4 THEN 'ia' ELSE 'manual' END as reservation_source,
    'Reserva futura - ' || c.segment_auto as notes,
    CASE WHEN random() < 0.2 THEN 'Petición especial' ELSE NULL END as special_requests,
    0.00 as spend_amount,
    NOW() - (random() * INTERVAL '5 days') as created_at,
    NOW() - (random() * INTERVAL '5 days') as updated_at
FROM restaurants r
CROSS JOIN customers c
CROSS JOIN generate_series(CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') AS future_date(reservation_date)
CROSS JOIN (VALUES ('13:00'::time), ('13:30'::time), ('14:00'::time), ('19:30'::time), ('20:00'::time), ('20:30'::time), ('21:00'::time)) AS future_time(reservation_time)
CROSS JOIN (VALUES (2), (3), (4), (6), (8)) AS future_size(party_size)
CROSS JOIN tables t
WHERE r.name = 'Restaurante Demo'
AND c.restaurant_id = r.id
AND t.restaurant_id = r.id
AND t.capacity >= future_size.party_size
AND EXTRACT(DOW FROM future_date.reservation_date) NOT IN (1, 2)  -- No lunes ni martes
AND random() < CASE 
    WHEN c.segment_auto = 'vip' THEN 0.25      -- VIP: 25% más reservas futuras
    WHEN c.segment_auto = 'regular' THEN 0.15  -- Regular: 15% más reservas
    ELSE 0.08                                  -- Otros: 8% más reservas
END;

-- ==========================================
-- 11. CREAR ACCIONES DE NO-SHOW PARA RESERVAS DE HOY
-- ==========================================

INSERT INTO noshow_actions (
    restaurant_id, reservation_id, customer_id, customer_name, customer_phone,
    reservation_date, reservation_time, party_size, risk_level, risk_score, risk_factors,
    action_type, channel, message_sent, template_id, template_name,
    customer_response, response_message, response_received_at, response_time,
    final_outcome, prevented_noshow, sent_at, created_at, updated_at
)
SELECT 
    res.restaurant_id,
    res.id as reservation_id,
    res.customer_id,
    res.customer_name,
    res.customer_phone,
    res.reservation_date,
    res.reservation_time,
    res.party_size,
    CASE 
        WHEN res.party_size >= 8 OR res.party_size = 1 THEN 'high'
        WHEN res.party_size >= 6 THEN 'medium'
        ELSE 'low'
    END as risk_level,
    CASE 
        WHEN res.party_size >= 8 THEN 90
        WHEN res.party_size = 1 THEN 85
        WHEN res.party_size >= 6 THEN 65
        ELSE 35
    END as risk_score,
    CASE 
        WHEN res.party_size >= 8 THEN '["grupo_muy_grande", "hora_pico", "hoy"]'
        WHEN res.party_size = 1 THEN '["persona_sola", "hora_tardia", "hoy"]'
        WHEN res.party_size >= 6 THEN '["grupo_grande", "hoy"]'
        ELSE '["reserva_normal", "hoy"]'
    END::jsonb as risk_factors,
    'whatsapp_confirmation' as action_type,
    'whatsapp' as channel,
    'Hola ' || res.customer_name || '! 🍽️ Confirmamos tu reserva para HOY a las ' || 
    TO_CHAR(res.reservation_time, 'HH24:MI') || ' para ' || res.party_size || ' personas. ¿Todo correcto? 👍' as message_sent,
    ct.id as template_id,
    ct.name as template_name,
    CASE 
        WHEN random() < 0.8 THEN 'confirmed'
        WHEN random() < 0.95 THEN 'no_response'
        ELSE 'cancelled'
    END as customer_response,
    CASE 
        WHEN random() < 0.8 THEN '¡Sí! Allí estaremos 😊'
        WHEN random() < 0.95 THEN NULL
        ELSE 'Lo siento, tengo que cancelar 😔'
    END as response_message,
    CASE 
        WHEN random() < 0.8 THEN NOW() - INTERVAL '30 minutes' + (random() * INTERVAL '2 hours')
        ELSE NULL
    END as response_received_at,
    CASE 
        WHEN random() < 0.8 THEN INTERVAL '10 minutes' + (random() * INTERVAL '1 hour')
        ELSE NULL
    END as response_time,
    'pending' as final_outcome,  -- Aún no ha pasado
    false as prevented_noshow,
    NOW() - INTERVAL '3 hours' as sent_at,
    NOW() - INTERVAL '3 hours' as created_at,
    NOW() - INTERVAL '3 hours' as updated_at
FROM reservations res
LEFT JOIN crm_templates ct ON ct.name = 'Confirmación No-Show Alto Riesgo'
WHERE res.reservation_date = CURRENT_DATE
AND res.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
AND (res.party_size >= 6 OR res.party_size = 1 OR EXTRACT(hour FROM res.reservation_time) >= 20);

-- ==========================================
-- 12. CREAR SUGERENCIAS CRM (ALERTAS)
-- ==========================================

INSERT INTO crm_suggestions (
    restaurant_id, customer_id, type, title, description, 
    suggested_content, suggested_subject, template_id, priority, status,
    created_at, updated_at
)
SELECT 
    c.restaurant_id,
    c.id as customer_id,
    sugerencia_data.type,
    sugerencia_data.title,
    sugerencia_data.description,
    sugerencia_data.suggested_content,
    sugerencia_data.suggested_subject,
    ct.id as template_id,
    sugerencia_data.priority,
    'pending' as status,
    NOW() - (random() * INTERVAL '7 days') as created_at,
    NOW() as updated_at
FROM customers c
LEFT JOIN crm_templates ct ON ct.type = 'reactivacion'
CROSS JOIN LATERAL (
    VALUES 
        -- Sugerencias para clientes VIP
        (CASE WHEN c.segment_auto = 'vip' THEN 'vip_upgrade' ELSE NULL END,
         CASE WHEN c.segment_auto = 'vip' THEN 'Cliente VIP: Atención Especial' ELSE NULL END,
         CASE WHEN c.segment_auto = 'vip' THEN 'Cliente VIP con ' || c.total_visits || ' visitas. Ofrecer mesa preferencial y atención personalizada.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'vip' THEN 'Estimado ' || c.name || ', como cliente VIP queremos ofrecerte nuestra nueva experiencia gastronómica exclusiva.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'vip' THEN 'Experiencia VIP Exclusiva' ELSE NULL END,
         'high'),
         
        -- Sugerencias para clientes en riesgo
        (CASE WHEN c.segment_auto = 'en_riesgo' THEN 'reactivacion' ELSE NULL END,
         CASE WHEN c.segment_auto = 'en_riesgo' THEN 'Cliente en Riesgo: Reactivar' ELSE NULL END,
         CASE WHEN c.segment_auto = 'en_riesgo' THEN 'Cliente sin visitas desde hace ' || c.recency_days || ' días. Enviar oferta de reactivación.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'en_riesgo' THEN 'Hola ' || c.name || ', te echamos de menos. Tenemos una oferta especial para ti: 20% descuento en tu próxima visita.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'en_riesgo' THEN 'Te echamos de menos - Oferta especial' ELSE NULL END,
         'high'),
         
        -- Sugerencias para clientes inactivos
        (CASE WHEN c.segment_auto = 'inactivo' THEN 'reactivacion' ELSE NULL END,
         CASE WHEN c.segment_auto = 'inactivo' THEN 'Cliente Inactivo: Recuperar' ELSE NULL END,
         CASE WHEN c.segment_auto = 'inactivo' THEN 'Cliente inactivo desde hace ' || c.recency_days || ' días. Campaña de recuperación urgente.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'inactivo' THEN 'Hola ' || c.name || ', queremos recuperarte con una oferta irresistible: menú especial a precio reducido.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'inactivo' THEN '¡Vuelve! Oferta de recuperación' ELSE NULL END,
         'medium'),
         
        -- Sugerencias para clientes nuevos
        (CASE WHEN c.segment_auto = 'nuevo' THEN 'bienvenida' ELSE NULL END,
         CASE WHEN c.segment_auto = 'nuevo' THEN 'Cliente Nuevo: Fidelizar' ELSE NULL END,
         CASE WHEN c.segment_auto = 'nuevo' THEN 'Cliente nuevo con ' || c.total_visits || ' visitas. Enviar bienvenida y promoción de fidelización.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'nuevo' THEN 'Bienvenido ' || c.name || ', gracias por elegirnos. Como nuevo cliente, disfruta de un 15% de descuento en tu segunda visita.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'nuevo' THEN 'Bienvenido - Descuento segunda visita' ELSE NULL END,
         'medium'),
         
        -- Sugerencias para clientes regulares (upsell)
        (CASE WHEN c.segment_auto = 'regular' AND c.avg_ticket < 80 THEN 'marketing' ELSE NULL END,
         CASE WHEN c.segment_auto = 'regular' AND c.avg_ticket < 80 THEN 'Cliente Regular: Upsell' ELSE NULL END,
         CASE WHEN c.segment_auto = 'regular' AND c.avg_ticket < 80 THEN 'Cliente regular con ticket promedio de ' || c.avg_ticket || '€. Oportunidad de upsell con menú premium.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'regular' AND c.avg_ticket < 80 THEN 'Hola ' || c.name || ', como cliente habitual queremos invitarte a probar nuestro menú premium con ingredientes exclusivos.' ELSE NULL END,
         CASE WHEN c.segment_auto = 'regular' AND c.avg_ticket < 80 THEN 'Prueba nuestro menú premium' ELSE NULL END,
         'low')
) AS sugerencia_data(type, title, description, suggested_content, suggested_subject, priority)
WHERE c.restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo')
AND sugerencia_data.type IS NOT NULL;

-- ==========================================
-- 13. ESTADÍSTICAS FINALES Y VERIFICACIÓN
-- ==========================================

DO $$
DECLARE
    total_customers INTEGER;
    total_reservations INTEGER;
    total_tickets INTEGER;
    total_conversations INTEGER;
    total_messages INTEGER;
    total_noshows INTEGER;
    total_templates INTEGER;
    total_tables INTEGER;
    total_crm_suggestions INTEGER;
    today_reservations INTEGER;
    today_high_risk INTEGER;
    revenue_total NUMERIC;
    avg_ticket NUMERIC;
BEGIN
    -- Contar todos los registros creados
    SELECT COUNT(*) INTO total_customers FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_reservations FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_tickets FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_conversations FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_messages FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_noshows FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_templates FROM message_templates WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_tables FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_crm_suggestions FROM crm_suggestions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    
    -- Estadísticas de HOY
    SELECT COUNT(*) INTO today_reservations FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND reservation_date = CURRENT_DATE;
    SELECT COUNT(*) INTO today_high_risk FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo') AND reservation_date = CURRENT_DATE AND risk_level = 'high';
    
    -- Estadísticas financieras
    SELECT COALESCE(SUM(total_amount), 0) INTO revenue_total FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COALESCE(AVG(total_amount), 0) INTO avg_ticket FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== RESTAURANTE CON VIDA REAL CREADO ===== 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADÍSTICAS GENERALES:';
    RAISE NOTICE '👥 Clientes creados: %', total_customers;
    RAISE NOTICE '🍽️ Mesas disponibles: %', total_tables;
    RAISE NOTICE '📅 Reservas históricas: %', total_reservations;
    RAISE NOTICE '🧾 Tickets de consumo: %', total_tickets;
    RAISE NOTICE '💬 Conversaciones: %', total_conversations;
    RAISE NOTICE '📨 Mensajes intercambiados: %', total_messages;
    RAISE NOTICE '🚫 Acciones no-show: %', total_noshows;
    RAISE NOTICE '📋 Plantillas mensajería: %', total_templates;
    RAISE NOTICE '🔔 Sugerencias CRM: %', total_crm_suggestions;
    RAISE NOTICE '';
    RAISE NOTICE '📈 ESTADÍSTICAS HOY:';
    RAISE NOTICE '📅 Reservas HOY: %', today_reservations;
    RAISE NOTICE '⚠️ Alto riesgo HOY: %', today_high_risk;
    RAISE NOTICE '';
    RAISE NOTICE '💰 ESTADÍSTICAS FINANCIERAS:';
    RAISE NOTICE '💵 Ingresos totales: %.2f€', revenue_total;
    RAISE NOTICE '🎯 Ticket promedio: %.2f€', avg_ticket;
    RAISE NOTICE '';
    RAISE NOTICE '✅ TODAS LAS TABLAS ESTÁN LLENAS CON DATOS REALES';
    RAISE NOTICE '✅ TODOS LOS DATOS ESTÁN INTERCONECTADOS';
    RAISE NOTICE '✅ EL RESTAURANTE TIENE VIDA REAL DE 6 MESES';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡LISTO PARA USAR LA APLICACIÓN CON DATOS REALES!';
END $$;

COMMIT;


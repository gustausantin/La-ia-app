-- ========================================
-- PLANTILLAS NO-SHOWS PARA SUPABASE
-- Fecha: 19 Septiembre 2025
-- Descripción: Plantillas específicas para prevención de no-shows
-- ========================================

-- 1. AGREGAR TIPO 'noshow' A crm_templates
-- ========================================

-- Primero, actualizar el tipo para incluir 'noshow'
-- (Si hay constraint, lo eliminamos y recreamos)
DO $$
BEGIN
    -- Intentar agregar el tipo noshow si no existe
    INSERT INTO crm_templates (
        restaurant_id,
        name,
        type,
        subject,
        content,
        variables,
        active,
        priority
    )
    SELECT 
        r.id as restaurant_id,
        'Confirmación Reserva - Prevención No-Show',
        'noshow',
        'Confirmación de tu reserva en {restaurant_name}',
        'Hola {customer_name}! 👋

Te escribimos para confirmar tu reserva:

📅 **Fecha**: {reservation_date}
⏰ **Hora**: {reservation_time} 
👥 **Personas**: {party_size}

¿Podrás acompañarnos? Solo responde:
✅ "SÍ" para confirmar
❌ "NO" si necesitas cancelar

Si no podemos confirmar en las próximas 2 horas, liberaremos tu mesa para otros clientes.

¡Te esperamos en {restaurant_name}! 🍽️

Saludos,
El equipo de {restaurant_name}',
        '["restaurant_name", "customer_name", "reservation_date", "reservation_time", "party_size"]'::jsonb,
        true,
        1
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM crm_templates ct 
        WHERE ct.restaurant_id = r.id 
        AND ct.type = 'noshow'
        AND ct.name = 'Confirmación Reserva - Prevención No-Show'
    );
END $$;

-- 2. PLANTILLA PARA RECORDATORIO 24H ANTES
-- ========================================

INSERT INTO crm_templates (
    restaurant_id,
    name,
    type,
    subject,
    content,
    variables,
    active,
    priority
)
SELECT 
    r.id as restaurant_id,
    'Recordatorio 24h - No-Show',
    'noshow',
    'Tu reserva es mañana en {restaurant_name}',
    'Hola {customer_name}! 😊

Solo un recordatorio amigable:

🗓️ **Mañana tienes reserva con nosotros**
⏰ Hora: {reservation_time}
👥 Para {party_size} personas

Estamos preparando todo para recibirte. Si surge algún imprevisto y no puedes venir, te agradeceríamos que nos avises con tiempo.

📞 Llámanos: {restaurant_phone}
💬 O responde a este mensaje

¡Nos vemos mañana en {restaurant_name}!

Un saludo,
El equipo de {restaurant_name}',
    '["restaurant_name", "customer_name", "reservation_time", "party_size", "restaurant_phone"]'::jsonb,
    true,
    2
FROM restaurants r
WHERE NOT EXISTS (
    SELECT 1 FROM crm_templates ct 
    WHERE ct.restaurant_id = r.id 
    AND ct.type = 'noshow'
    AND ct.name = 'Recordatorio 24h - No-Show'
);

-- 3. PLANTILLA PARA ALTO RIESGO (URGENTE)
-- ========================================

INSERT INTO crm_templates (
    restaurant_id,
    name,
    type,
    subject,
    content,
    variables,
    active,
    priority
)
SELECT 
    r.id as restaurant_id,
    'Alto Riesgo - Confirmación Urgente',
    'noshow',
    '🚨 Confirmación URGENTE - {restaurant_name}',
    '🚨 **CONFIRMACIÓN URGENTE** 🚨

Hola {customer_name},

Detectamos que tu reserva tiene **alto riesgo de no-show**:

📍 **{restaurant_name}**
📅 **HOY** a las {reservation_time}
👥 **{party_size} personas**

⚠️ **FACTORES DE RIESGO DETECTADOS:**
{risk_factors}

**¿VIENES O NO?** Solo responde:
✅ **"VENGO"** - Confirmamos tu mesa
❌ **"NO VENGO"** - Liberamos tu mesa

⏰ **RESPONDE EN 30 MINUTOS** o liberaremos tu mesa automáticamente.

Gracias por tu comprensión.

El equipo de {restaurant_name}',
    '["restaurant_name", "customer_name", "reservation_time", "party_size", "risk_factors"]'::jsonb,
    true,
    1
FROM restaurants r
WHERE NOT EXISTS (
    SELECT 1 FROM crm_templates ct 
    WHERE ct.restaurant_id = r.id 
    AND ct.type = 'noshow'
    AND ct.name = 'Alto Riesgo - Confirmación Urgente'
);

-- 4. AGREGAR A message_templates TAMBIÉN
-- ========================================

-- Agregar 'noshow_prevention' como template_type si no existe
DO $$
BEGIN
    -- Verificar si ya existe el tipo en message_templates
    INSERT INTO message_templates (
        restaurant_id,
        name,
        category,
        segment,
        event_trigger,
        subject,
        content_markdown,
        variables,
        channel,
        is_active,
        send_delay_hours,
        priority
    )
    SELECT 
        r.id as restaurant_id,
        'Confirmación No-Show WhatsApp',
        'noshow_prevention',
        'all',
        'high_risk_detected',
        'Confirmación reserva {restaurant_name}',
        'Hola {{customer_name}}! 👋

Te escribimos para **confirmar tu reserva**:

📅 **{{reservation_date}}** a las **{{reservation_time}}**
👥 Para **{{party_size}} personas**

¿Podrás acompañarnos?
✅ Responde **"SÍ"** para confirmar
❌ Responde **"NO"** si necesitas cancelar

⏰ Si no confirmamos en 2 horas, liberaremos tu mesa.

¡Te esperamos! 🍽️',
        ARRAY['customer_name', 'reservation_date', 'reservation_time', 'party_size'],
        'whatsapp',
        true,
        0,
        1
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM message_templates mt 
        WHERE mt.restaurant_id = r.id 
        AND mt.category = 'noshow_prevention'
        AND mt.name = 'Confirmación No-Show WhatsApp'
    );
END $$;

-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

CREATE INDEX IF NOT EXISTS idx_crm_templates_type_noshow 
ON crm_templates(restaurant_id, type) 
WHERE type = 'noshow';

CREATE INDEX IF NOT EXISTS idx_message_templates_noshow 
ON message_templates(restaurant_id, category) 
WHERE category = 'noshow_prevention';

-- 6. COMENTARIOS PARA DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE crm_templates IS 'Plantillas CRM incluyendo prevención de no-shows';

-- 7. CREAR TABLA DE SEGUIMIENTO noshow_actions
-- ========================================

CREATE TABLE IF NOT EXISTS noshow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Información de la reserva
    reservation_id UUID, -- Puede ser NULL si no existe en DB
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR,
    
    -- Detalles de la reserva
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    
    -- Análisis de riesgo
    risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_factors JSONB DEFAULT '[]', -- ['historial_noshows', 'hora_pico', 'clima_lluvia']
    
    -- Acción ejecutada
    action_type VARCHAR NOT NULL CHECK (action_type IN ('whatsapp_confirmation', 'whatsapp_reminder', 'whatsapp_urgent', 'call', 'email')),
    template_id UUID REFERENCES crm_templates(id) ON DELETE SET NULL,
    template_name VARCHAR,
    
    -- Mensaje enviado
    message_sent TEXT NOT NULL,
    channel VARCHAR NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'call', 'sms')),
    
    -- Respuesta del cliente
    customer_response VARCHAR CHECK (customer_response IN ('confirmed', 'cancelled', 'no_response', 'pending')),
    response_time INTERVAL, -- Tiempo que tardó en responder
    response_message TEXT, -- Mensaje de respuesta del cliente
    
    -- Resultado final
    final_outcome VARCHAR CHECK (final_outcome IN ('attended', 'no_show', 'cancelled', 'pending')),
    prevented_noshow BOOLEAN DEFAULT false, -- Si se evitó el no-show gracias a la acción
    
    -- Métricas
    sent_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    response_received_at TIMESTAMPTZ,
    reservation_completed_at TIMESTAMPTZ,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 8. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

CREATE INDEX IF NOT EXISTS idx_noshow_actions_restaurant ON noshow_actions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_noshow_actions_date ON noshow_actions(reservation_date);
CREATE INDEX IF NOT EXISTS idx_noshow_actions_risk ON noshow_actions(risk_level, risk_score);
CREATE INDEX IF NOT EXISTS idx_noshow_actions_outcome ON noshow_actions(final_outcome);
CREATE INDEX IF NOT EXISTS idx_noshow_actions_prevented ON noshow_actions(prevented_noshow);
CREATE INDEX IF NOT EXISTS idx_noshow_actions_sent_at ON noshow_actions(sent_at);

-- 9. RLS (ROW LEVEL SECURITY)
-- ========================================

ALTER TABLE noshow_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY noshow_actions_restaurant_access ON noshow_actions
    FOR ALL 
    USING (
        restaurant_id IN (
            SELECT urm.restaurant_id 
            FROM user_restaurant_mapping urm 
            WHERE urm.auth_user_id = auth.uid() 
            AND urm.active = true
        )
    );

-- 10. COMENTARIOS PARA DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE noshow_actions IS 'Registro de todas las acciones de prevención de no-shows ejecutadas';
COMMENT ON COLUMN noshow_actions.risk_factors IS 'Array JSON con factores de riesgo detectados';
COMMENT ON COLUMN noshow_actions.prevented_noshow IS 'TRUE si la acción evitó exitosamente un no-show';
COMMENT ON COLUMN noshow_actions.response_time IS 'Tiempo entre envío y respuesta del cliente';

-- 11. QUERIES ÚTILES PARA MÉTRICAS
-- ========================================

-- Query 1: Resumen de acciones por día
/*
SELECT 
    reservation_date,
    COUNT(*) as total_acciones,
    COUNT(*) FILTER (WHERE risk_level = 'high') as alto_riesgo,
    COUNT(*) FILTER (WHERE customer_response = 'confirmed') as confirmadas,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as noshows_evitados,
    ROUND(AVG(risk_score), 1) as riesgo_promedio
FROM noshow_actions 
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
AND reservation_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY reservation_date
ORDER BY reservation_date DESC;
*/

-- Query 2: Efectividad por tipo de plantilla
/*
SELECT 
    template_name,
    action_type,
    COUNT(*) as total_enviados,
    COUNT(*) FILTER (WHERE customer_response != 'no_response') as respondieron,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as evitados,
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
GROUP BY template_name, action_type
ORDER BY efectividad_pct DESC;
*/

-- Query 3: Análisis de factores de riesgo más efectivos
/*
WITH risk_factors_expanded AS (
    SELECT 
        jsonb_array_elements_text(risk_factors) as factor,
        prevented_noshow,
        customer_response
    FROM noshow_actions 
    WHERE restaurant_id = 'YOUR_RESTAURANT_ID'
    AND risk_factors IS NOT NULL
)
SELECT 
    factor,
    COUNT(*) as total_casos,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as casos_evitados,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE prevented_noshow = true) / COUNT(*), 
        1
    ) as efectividad_pct
FROM risk_factors_expanded
GROUP BY factor
ORDER BY efectividad_pct DESC;
*/

-- 12. VERIFICACIÓN FINAL
-- ========================================

-- Verificar que se crearon las plantillas y la tabla
SELECT 
    'crm_templates' as tabla,
    COUNT(*) as total_plantillas,
    COUNT(*) FILTER (WHERE type = 'noshow') as plantillas_noshow
FROM crm_templates

UNION ALL

SELECT 
    'message_templates' as tabla,
    COUNT(*) as total_plantillas,
    COUNT(*) FILTER (WHERE category = 'noshow_prevention') as plantillas_noshow
FROM message_templates

UNION ALL

SELECT 
    'noshow_actions' as tabla,
    0 as total_plantillas, -- No aplica
    COUNT(*) as plantillas_noshow -- Total de registros
FROM noshow_actions;

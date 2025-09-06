    -- CRM INTELIGENTE - ESTRUCTURAS SUPABASE
    -- Crear tablas necesarias para el CRM funcional

    -- 1. TABLA DE PLANTILLAS CRM
    CREATE TABLE IF NOT EXISTS crm_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        
        -- Información de la plantilla
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL, -- 'nuevo', 'activo', 'bib', 'inactivo', 'riesgo'
        subject VARCHAR NOT NULL,
        content TEXT NOT NULL,
        variables JSONB DEFAULT '[]', -- Variables dinámicas como {restaurant_name}, {customer_name}
        
        -- Estado y configuración
        active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1, -- 1-5 prioridad de la plantilla
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
        updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
    );

    -- 2. TABLA DE CONFIGURACIÓN CRM
    CREATE TABLE IF NOT EXISTS crm_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        
        -- Reglas de segmentación (en días)
        days_new_customer INTEGER DEFAULT 7, -- Qué significa "nuevo"
        days_active_customer INTEGER DEFAULT 30, -- Qué significa "activo" 
        days_inactive_customer INTEGER DEFAULT 60, -- Qué significa "inactivo"
        visits_bib_customer INTEGER DEFAULT 10, -- Visitas para ser BIB
        days_risk_customer INTEGER DEFAULT 45, -- Días para estar "en riesgo"
        
        -- Frecuencia de mensajes automáticos
        frequency_reactivation INTEGER DEFAULT 90, -- Cada cuántos días sugerir reactivación
        frequency_welcome INTEGER DEFAULT 1, -- Días después del registro para bienvenida
        frequency_bib_promotion INTEGER DEFAULT 180, -- Días para evaluar promoción BIB
        
        -- Configuración general
        auto_suggestions BOOLEAN DEFAULT true, -- Activar sugerencias automáticas
        auto_segmentation BOOLEAN DEFAULT true, -- Activar segmentación automática
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
        updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
        
        -- Constraint: solo una configuración por restaurante
        UNIQUE(restaurant_id)
    );

    -- 3. TABLA DE MENSAJES SUGERIDOS
    CREATE TABLE IF NOT EXISTS crm_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        template_id UUID REFERENCES crm_templates(id) ON DELETE SET NULL,
        
        -- Información de la sugerencia
        type VARCHAR NOT NULL, -- 'reactivacion', 'bienvenida', 'bib', etc.
        priority VARCHAR DEFAULT 'medium', -- 'high', 'medium', 'low'
        title VARCHAR NOT NULL,
        description TEXT,
        
        -- Estado de la sugerencia
        status VARCHAR DEFAULT 'pending', -- 'pending', 'sent', 'dismissed'
        suggested_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
        executed_at TIMESTAMPTZ,
        
        -- Datos del mensaje sugerido
        suggested_subject VARCHAR,
        suggested_content TEXT,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
        updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
    );

    -- 4. ÍNDICES PARA PERFORMANCE
    CREATE INDEX IF NOT EXISTS idx_crm_templates_restaurant_type ON crm_templates(restaurant_id, type);
    CREATE INDEX IF NOT EXISTS idx_crm_suggestions_restaurant_status ON crm_suggestions(restaurant_id, status);
    CREATE INDEX IF NOT EXISTS idx_crm_suggestions_customer ON crm_suggestions(customer_id);

    -- 5. RLS (Row Level Security)
    ALTER TABLE crm_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crm_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crm_suggestions ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS para crm_templates
    CREATE POLICY "Users can view their restaurant's CRM templates" ON crm_templates
        FOR SELECT USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    CREATE POLICY "Users can manage their restaurant's CRM templates" ON crm_templates
        FOR ALL USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    -- Políticas RLS para crm_settings
    CREATE POLICY "Users can view their restaurant's CRM settings" ON crm_settings
        FOR SELECT USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    CREATE POLICY "Users can manage their restaurant's CRM settings" ON crm_settings
        FOR ALL USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    -- Políticas RLS para crm_suggestions
    CREATE POLICY "Users can view their restaurant's CRM suggestions" ON crm_suggestions
        FOR SELECT USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    CREATE POLICY "Users can manage their restaurant's CRM suggestions" ON crm_suggestions
        FOR ALL USING (
            restaurant_id IN (
                SELECT restaurant_id FROM user_restaurant_mapping 
                WHERE auth_user_id = auth.uid() AND active = true
            )
        );

    -- 6. DATOS INICIALES DE PLANTILLAS
    INSERT INTO crm_templates (restaurant_id, name, type, subject, content, variables, priority) 
    SELECT 
        r.id,
        'Reactivación Estándar',
        'inactivo',
        'Te echamos de menos en {restaurant_name}',
        'Hola {customer_name},

    ¡Hace tiempo que no te vemos por {restaurant_name}! 

    Tenemos nuevos platos que creemos te van a encantar, y hemos mejorado nuestra experiencia especialmente para clientes como tú.

    ¿Qué te parece si reservas una mesa para esta semana? Te garantizamos una experiencia excepcional.

    ¡Esperamos verte pronto!

    El equipo de {restaurant_name}',
        '["restaurant_name", "customer_name", "last_visit_date"]'::jsonb,
        1
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM crm_templates ct 
        WHERE ct.restaurant_id = r.id AND ct.type = 'inactivo'
    );

    INSERT INTO crm_templates (restaurant_id, name, type, subject, content, variables, priority)
    SELECT 
        r.id,
        'Bienvenida Nuevos',
        'nuevo',
        '¡Bienvenido a {restaurant_name}!',
        '¡Hola {customer_name}!

    Gracias por visitarnos por primera vez. Esperamos que hayas disfrutado de tu experiencia en {restaurant_name}.

    Como nuevo cliente, queremos asegurarnos de que tengas la mejor experiencia posible. Si tienes alguna sugerencia o comentario, no dudes en contactarnos.

    ¡Esperamos verte pronto de nuevo!

    Un saludo,
    El equipo de {restaurant_name}',
        '["restaurant_name", "customer_name", "visit_date"]'::jsonb,
        2
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM crm_templates ct 
        WHERE ct.restaurant_id = r.id AND ct.type = 'nuevo'
    );

    INSERT INTO crm_templates (restaurant_id, name, type, subject, content, variables, priority)
    SELECT 
        r.id,
        'Promoción BIB',
        'bib',
        '¡Felicidades! Ahora eres cliente BIB de {restaurant_name}',
        '¡Hola {customer_name}!

    Nos complace informarte que ahora formas parte de nuestro programa BIB (Best In Business) en {restaurant_name}.

    Como cliente BIB, disfrutarás de:
    • Reservas prioritarias
    • Atención personalizada
    • Invitaciones a eventos exclusivos
    • Experiencias únicas

    ¡Gracias por tu fidelidad!

    El equipo de {restaurant_name}',
        '["restaurant_name", "customer_name", "bib_benefits"]'::jsonb,
        3
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM crm_templates ct 
        WHERE ct.restaurant_id = r.id AND ct.type = 'bib'
    );

    -- 7. CONFIGURACIÓN INICIAL CRM
    INSERT INTO crm_settings (restaurant_id)
    SELECT r.id
    FROM restaurants r
    WHERE NOT EXISTS (
        SELECT 1 FROM crm_settings cs 
        WHERE cs.restaurant_id = r.id
    );

    COMMENT ON TABLE crm_templates IS 'Plantillas de mensajes CRM por tipo de cliente';
    COMMENT ON TABLE crm_settings IS 'Configuración de reglas CRM por restaurante';
    COMMENT ON TABLE crm_suggestions IS 'Sugerencias automáticas de mensajes CRM';

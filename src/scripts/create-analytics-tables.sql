-- 🚀 CREAR TABLAS ANALYTICS PARA QUE LA PÁGINA FUNCIONE

-- 1. TABLA: agent_conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    status VARCHAR(50) DEFAULT 'active',
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    channel VARCHAR(50), -- whatsapp, vapi, etc
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    messages_count INTEGER DEFAULT 0,
    satisfaction_score INTEGER, -- 1-5
    booking_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: agent_metrics (métricas diarias)
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    date DATE DEFAULT CURRENT_DATE,
    total_conversations INTEGER DEFAULT 0,
    successful_bookings INTEGER DEFAULT 0,
    avg_response_time FLOAT DEFAULT 0, -- segundos
    conversion_rate FLOAT DEFAULT 0, -- %
    customer_satisfaction FLOAT DEFAULT 0, -- promedio 1-5
    channel_breakdown JSONB DEFAULT '{}', -- stats por canal
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, date)
);

-- 3. TABLA: conversation_analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES agent_conversations(id),
    restaurant_id UUID REFERENCES restaurants(id),
    total_messages INTEGER DEFAULT 0,
    ai_messages INTEGER DEFAULT 0,
    human_messages INTEGER DEFAULT 0,
    avg_response_time FLOAT DEFAULT 0,
    intent_detected VARCHAR(100),
    sentiment_score FLOAT DEFAULT 0, -- -1 a 1
    topics JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: channel_performance
CREATE TABLE IF NOT EXISTS channel_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    channel VARCHAR(50), -- whatsapp, vapi, email, etc
    date DATE DEFAULT CURRENT_DATE,
    conversations INTEGER DEFAULT 0,
    bookings INTEGER DEFAULT 0,
    conversion_rate FLOAT DEFAULT 0,
    avg_response_time FLOAT DEFAULT 0,
    customer_satisfaction FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, channel, date)
);

-- 5. TABLA: agent_insights (insights automáticos)
CREATE TABLE IF NOT EXISTS agent_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    type VARCHAR(50), -- performance, optimization, alert
    title VARCHAR(255),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    action_required BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. INSERTAR DATOS DEMO PARA EL RESTAURANT ACTUAL
DO $$
DECLARE
    target_restaurant_id UUID;
BEGIN
    -- Obtener restaurant ID
    SELECT id INTO target_restaurant_id 
    FROM restaurants 
    WHERE owner_id = (
        SELECT id FROM auth.users WHERE email = 'gustausantin@gmail.com'
    );
    
    IF target_restaurant_id IS NULL THEN
        RAISE NOTICE 'Restaurant no encontrado para insertar datos demo';
        RETURN;
    END IF;
    
    -- Insertar métricas demo para últimos 7 días
    INSERT INTO agent_metrics (
        restaurant_id, date, total_conversations, successful_bookings, 
        avg_response_time, conversion_rate, customer_satisfaction
    ) VALUES 
    (target_restaurant_id, CURRENT_DATE - INTERVAL '6 days', 25, 18, 2.5, 72.0, 4.2),
    (target_restaurant_id, CURRENT_DATE - INTERVAL '5 days', 30, 22, 2.1, 73.3, 4.3),
    (target_restaurant_id, CURRENT_DATE - INTERVAL '4 days', 28, 20, 2.8, 71.4, 4.1),
    (target_restaurant_id, CURRENT_DATE - INTERVAL '3 days', 35, 26, 2.3, 74.3, 4.4),
    (target_restaurant_id, CURRENT_DATE - INTERVAL '2 days', 40, 30, 2.0, 75.0, 4.5),
    (target_restaurant_id, CURRENT_DATE - INTERVAL '1 days', 45, 34, 1.8, 75.6, 4.4),
    (target_restaurant_id, CURRENT_DATE, 38, 28, 2.2, 73.7, 4.3);
    
    -- Insertar conversaciones demo activas
    INSERT INTO agent_conversations (
        restaurant_id, status, customer_phone, customer_name, 
        channel, messages_count, satisfaction_score, booking_created
    ) VALUES 
    (target_restaurant_id, 'active', '+34600123456', 'María García', 'whatsapp', 8, 5, TRUE),
    (target_restaurant_id, 'active', '+34600789012', 'Juan López', 'vapi', 12, 4, TRUE),
    (target_restaurant_id, 'completed', '+34600345678', 'Ana Martín', 'whatsapp', 6, 5, TRUE),
    (target_restaurant_id, 'active', '+34600901234', 'Carlos Ruiz', 'email', 4, 4, FALSE);
    
    -- Insertar performance por canal
    INSERT INTO channel_performance (
        restaurant_id, channel, date, conversations, bookings, 
        conversion_rate, avg_response_time, customer_satisfaction
    ) VALUES 
    (target_restaurant_id, 'whatsapp', CURRENT_DATE, 20, 15, 75.0, 1.8, 4.4),
    (target_restaurant_id, 'vapi', CURRENT_DATE, 12, 9, 75.0, 2.1, 4.3),
    (target_restaurant_id, 'email', CURRENT_DATE, 6, 4, 66.7, 3.2, 4.0);
    
    -- Insertar insights demo
    INSERT INTO agent_insights (
        restaurant_id, type, title, description, priority, action_required
    ) VALUES 
    (target_restaurant_id, 'performance', 'Excelente conversión', 'Tu agente IA tiene una tasa de conversión del 73.7%, superior al promedio del sector (65%).', 'medium', FALSE),
    (target_restaurant_id, 'optimization', 'Mejora en horario nocturno', 'Se detectó una oportunidad de mejora en las respuestas entre 22:00-24:00.', 'low', TRUE),
    (target_restaurant_id, 'alert', 'Pico de demanda detectado', 'Se espera un incremento del 40% en reservas para el fin de semana.', 'high', TRUE);
    
    RAISE NOTICE '✅ DATOS DEMO INSERTADOS para restaurant: %', target_restaurant_id;
    
END $$;

-- 7. VERIFICAR CREACIÓN
SELECT 'TABLAS CREADAS:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%agent%' OR table_name LIKE '%conversation%' OR table_name LIKE '%channel%'
ORDER BY table_name;

-- 8. VERIFICAR DATOS
SELECT 'DATOS INSERTADOS:' as info;
SELECT 
    (SELECT COUNT(*) FROM agent_metrics) as agent_metrics,
    (SELECT COUNT(*) FROM agent_conversations) as conversations,
    (SELECT COUNT(*) FROM channel_performance) as channel_perf,
    (SELECT COUNT(*) FROM agent_insights) as insights;

-- 9. CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '🚀 ANALYTICS TABLES READY - Página debería funcionar ahora';
END $$;

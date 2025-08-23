-- 🏗️ CREAR TABLAS FALTANTES PARA LA APLICACIÓN
-- Ejecutar en Supabase SQL Editor

-- =========================================
-- TABLA: RESERVATIONS
-- =========================================

-- Crear tabla reservations si no existe
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    
    -- Información básica de la reserva
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Fechas y horarios (ambos formatos para compatibilidad)
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    date DATE GENERATED ALWAYS AS (reservation_date) STORED,
    time TIME GENERATED ALWAYS AS (reservation_time) STORED,
    
    -- Detalles de la reserva
    party_size INTEGER NOT NULL DEFAULT 2,
    duration_minutes INTEGER DEFAULT 90,
    special_requests TEXT,
    
    -- Estados y gestión
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'sentada', 'completada', 'cancelada', 'no_show')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('agent', 'manual')),
    channel TEXT DEFAULT 'manual' CHECK (channel IN ('whatsapp', 'vapi', 'web', 'instagram', 'facebook', 'manual')),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Información del agente IA (si aplica)
    agent_conversation_id TEXT,
    agent_confidence_score DECIMAL(3,2),
    agent_notes TEXT
);

-- =========================================
-- TABLA: CUSTOMERS
-- =========================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Información básica
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birthday DATE,
    
    -- Direcciones
    address TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Métricas del cliente
    total_reservations INTEGER DEFAULT 0,
    total_no_shows INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    avg_party_size DECIMAL(3,1) DEFAULT 2.0,
    last_visit DATE,
    
    -- Información del agente IA
    acquisition_channel TEXT DEFAULT 'manual' CHECK (acquisition_channel IN ('whatsapp', 'vapi', 'web', 'instagram', 'facebook', 'manual')),
    preferred_channel TEXT,
    ai_score DECIMAL(3,2), -- Puntuación de IA (0-1)
    predicted_ltv DECIMAL(10,2), -- Valor de vida predicho
    churn_risk_score DECIMAL(3,2), -- Riesgo de abandono (0-1)
    ai_segment TEXT, -- Segmento asignado por IA
    ai_preferences JSONB, -- Preferencias detectadas por IA
    last_ai_interaction TIMESTAMP WITH TIME ZONE,
    
    -- Configuración de marketing
    vip_status BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- TABLA: TABLES
-- =========================================

CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Información de la mesa
    table_number INTEGER NOT NULL,
    name TEXT, -- Nombre personalizado (ej: "Mesa de la ventana")
    capacity INTEGER NOT NULL DEFAULT 4,
    zone TEXT DEFAULT 'interior', -- interior, terraza, barra, privado
    
    -- Estado y disponibilidad
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Características especiales
    features JSONB, -- smoking, view, quiet, etc.
    position_x INTEGER, -- Para plano del restaurante
    position_y INTEGER,
    
    -- Configuración del agente IA
    ai_priority INTEGER DEFAULT 5, -- 1-10, prioridad para asignación automática
    ai_suitable_for JSONB, -- tipos de clientes adecuados
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, table_number)
);

-- =========================================
-- TABLA: ANALYTICS (para dashboard)
-- =========================================

CREATE TABLE IF NOT EXISTS analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Período de la métrica
    date DATE NOT NULL,
    hour INTEGER, -- NULL para métricas diarias, 0-23 para métricas horarias
    
    -- Métricas de reservas
    total_reservations INTEGER DEFAULT 0,
    total_covers INTEGER DEFAULT 0, -- total de personas
    agent_reservations INTEGER DEFAULT 0,
    manual_reservations INTEGER DEFAULT 0,
    
    -- Métricas por canal
    whatsapp_reservations INTEGER DEFAULT 0,
    vapi_reservations INTEGER DEFAULT 0,
    web_reservations INTEGER DEFAULT 0,
    instagram_reservations INTEGER DEFAULT 0,
    facebook_reservations INTEGER DEFAULT 0,
    
    -- Métricas de performance del agente
    agent_response_time_avg DECIMAL(5,2), -- segundos
    agent_success_rate DECIMAL(3,2), -- 0-1
    agent_escalations INTEGER DEFAULT 0,
    
    -- Métricas de negocio
    revenue DECIMAL(10,2),
    avg_party_size DECIMAL(3,1),
    occupancy_rate DECIMAL(3,2), -- 0-1
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, date, hour)
);

-- =========================================
-- ÍNDICES PARA PERFORMANCE
-- =========================================

-- Reservations
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_source ON reservations(source);
CREATE INDEX IF NOT EXISTS idx_reservations_channel ON reservations(channel);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(ai_segment);

-- Tables
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_zone ON tables(zone);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_date ON analytics(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_date_hour ON analytics(date, hour);

-- =========================================
-- RLS POLICIES
-- =========================================

-- Reservations RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservations: Users can view own restaurant reservations" ON reservations
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Reservations: Users can insert own restaurant reservations" ON reservations
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Reservations: Users can update own restaurant reservations" ON reservations
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Customers RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers: Users can manage own restaurant customers" ON customers
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Tables RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tables: Users can manage own restaurant tables" ON tables
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Analytics RLS
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics: Users can view own restaurant analytics" ON analytics
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- =========================================
-- TRIGGERS PARA UPDATED_AT
-- =========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- DATOS DE EJEMPLO PARA TESTING
-- =========================================

-- Solo insertar si no hay datos (para evitar duplicados)
DO $$
DECLARE
    rest_id UUID;
    table_id UUID;
    customer_id UUID;
BEGIN
    -- Obtener un restaurant existente
    SELECT id INTO rest_id FROM restaurants LIMIT 1;
    
    IF rest_id IS NOT NULL THEN
        -- Crear mesas de ejemplo
        INSERT INTO tables (restaurant_id, table_number, capacity, zone) 
        VALUES 
            (rest_id, 1, 4, 'interior'),
            (rest_id, 2, 2, 'interior'),
            (rest_id, 3, 6, 'terraza'),
            (rest_id, 4, 8, 'privado')
        ON CONFLICT (restaurant_id, table_number) DO NOTHING
        RETURNING id INTO table_id;
        
        -- Crear cliente de ejemplo
        INSERT INTO customers (restaurant_id, name, email, phone, acquisition_channel)
        VALUES (rest_id, 'Juan Pérez', 'juan@example.com', '+34 600 000 001', 'whatsapp')
        ON CONFLICT DO NOTHING
        RETURNING id INTO customer_id;
        
        -- Crear reserva de ejemplo
        INSERT INTO reservations (
            restaurant_id, customer_id, table_id, customer_name, customer_phone,
            reservation_date, reservation_time, party_size, source, channel
        )
        VALUES (
            rest_id, customer_id, table_id, 'Juan Pérez', '+34 600 000 001',
            CURRENT_DATE + INTERVAL '1 day', '20:00', 4, 'agent', 'whatsapp'
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Datos de ejemplo creados para restaurant: %', rest_id;
    END IF;
END $$;

RAISE NOTICE '🎉 SCHEMA COMPLETO CREADO - Todas las tablas están listas para la aplicación';

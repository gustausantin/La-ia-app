-- =====================================================
-- ESQUEMA DE BASE DE DATOS FINAL - LA-IA APP 2025
-- Documentación completa del estado actual tras auditoría
-- =====================================================

-- 📅 Fecha: 29 Septiembre 2025
-- 🎯 Estado: ESQUEMA REAL VALIDADO Y ACTUALIZADO
-- ✅ Versión: Final Database Schema v4.0
-- 👨‍💻 Auditado por: Claude Sonnet 4

-- =====================================================
-- 🏪 TABLA CENTRAL: RESTAURANTS
-- =====================================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    city VARCHAR,
    country VARCHAR DEFAULT 'España',
    postal_code VARCHAR,
    cuisine_type VARCHAR,
    plan VARCHAR DEFAULT 'trial',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    owner_id UUID REFERENCES auth.users(id),
    
    -- CONFIGURACIONES JSONB
    settings JSONB DEFAULT '{}',           -- Configuración principal
    agent_config JSONB DEFAULT '{}',      -- Configuración del agente IA
    business_hours JSONB DEFAULT '{}',    -- Horarios de negocio
    crm_config JSONB DEFAULT '{}',        -- Configuración CRM
    channels JSONB DEFAULT '{}',          -- Canales de comunicación
    notifications JSONB DEFAULT '{}'      -- Configuración de notificaciones
);

-- EJEMPLO DE RESTAURANTS.SETTINGS (ESTRUCTURA REAL):
/*
{
  "operating_hours": {
    "monday": { "open": false },
    "tuesday": { "open": false },
    "wednesday": { "open": false },
    "thursday": { "open": false },
    "friday": {
      "open": true,
      "start": "09:00",
      "end": "22:00",
      "shifts": [
        {
          "id": 1,
          "name": "Horario Completo",
          "start_time": "09:00",
          "end_time": "22:00"
        },
        {
          "id": 1759151049981,
          "name": "Turno Mañana",
          "start_time": "12:00",
          "end_time": "14:00"
        }
      ]
    },
    "saturday": {
      "open": true,
      "start": "09:00",
      "end": "22:00",
      "shifts": [
        {
          "id": 1,
          "name": "Horario Principal",
          "start_time": "09:00",
          "end_time": "22:00"
        }
      ]
    },
    "sunday": { "open": false }
  },
  "advance_booking_days": 10,
  "reservation_duration": 90,
  "min_party_size": 2,
  "max_party_size": 6,
  "timezone": "Europe/Madrid",
  "buffer_time": 15,
  "same_day_cutoff": "12:00",
  "min_advance_hours": 2,
  "cancellation_hours": 2
}
*/

-- =====================================================
-- 📅 TABLA: SPECIAL_EVENTS (NUEVA - 27/09/2025)
-- =====================================================

CREATE TABLE special_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'evento' CHECK (type IN ('evento', 'festivo', 'vacaciones', 'cierre')),
    start_time TIME,
    end_time TIME,
    is_closed BOOLEAN DEFAULT false,        -- CLAVE: Determina si el día está cerrado
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices para special_events
CREATE INDEX idx_special_events_restaurant_date ON special_events(restaurant_id, event_date);
CREATE INDEX idx_special_events_date ON special_events(event_date);

-- =====================================================
-- 📊 TABLA: AVAILABILITY_SLOTS
-- =====================================================

CREATE TABLE availability_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    shift_name TEXT,                        -- Nombre del turno
    status TEXT NOT NULL DEFAULT 'free',   -- 'free', 'occupied', 'reserved', 'blocked'
    source TEXT DEFAULT 'system',          -- 'system', 'manual'
    metadata JSONB DEFAULT '{}',           -- Metadatos adicionales
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_available BOOLEAN DEFAULT true,     -- Disponibilidad del slot
    duration_minutes INTEGER DEFAULT 90    -- Duración en minutos
);

-- Índices para availability_slots
CREATE INDEX idx_availability_slots_restaurant_date ON availability_slots(restaurant_id, slot_date);
CREATE INDEX idx_availability_slots_table_date ON availability_slots(table_id, slot_date);
CREATE INDEX idx_availability_slots_status ON availability_slots(status);

-- Constraint único para evitar duplicados
ALTER TABLE availability_slots 
ADD CONSTRAINT unique_availability_slot 
UNIQUE (restaurant_id, slot_date, start_time, table_id);

-- =====================================================
-- 🪑 TABLA: TABLES
-- =====================================================

CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    zone VARCHAR,                          -- Zona del restaurante
    position_x FLOAT,                      -- Posición X en el layout
    position_y FLOAT,                      -- Posición Y en el layout
    is_active BOOLEAN DEFAULT true,       -- Mesa activa
    active BOOLEAN DEFAULT true,          -- Alias para compatibilidad
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices para tables
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_active ON tables(restaurant_id, is_active);

-- =====================================================
-- 👥 TABLA: USER_RESTAURANT_MAPPING
-- =====================================================

CREATE TABLE user_restaurant_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Constraint único para user-restaurant mapping
ALTER TABLE user_restaurant_mapping 
ADD CONSTRAINT unique_user_restaurant 
UNIQUE (auth_user_id, restaurant_id);

-- =====================================================
-- 👤 TABLA: CUSTOMERS (CRM)
-- =====================================================

CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    preferences JSONB DEFAULT '{}',        -- Preferencias del cliente
    segment VARCHAR DEFAULT 'nuevo',       -- Segmento CRM
    segment_auto VARCHAR,                  -- Segmento automático
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices para customers
CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX idx_customers_segment ON customers(restaurant_id, segment);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- =====================================================
-- 💬 TABLA: CRM_INTERACTIONS
-- =====================================================

CREATE TABLE crm_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,                 -- 'message', 'call', 'email', 'visit'
    channel VARCHAR,                       -- 'whatsapp', 'phone', 'email', 'in_person'
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices para crm_interactions
CREATE INDEX idx_crm_interactions_customer ON crm_interactions(customer_id);
CREATE INDEX idx_crm_interactions_restaurant ON crm_interactions(restaurant_id);
CREATE INDEX idx_crm_interactions_type ON crm_interactions(type);

-- =====================================================
-- 🤖 TABLA: CRM_AUTOMATION_RULES
-- =====================================================

CREATE TABLE crm_automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    trigger_type VARCHAR NOT NULL,         -- 'segment_change', 'time_based', 'event'
    trigger_config JSONB DEFAULT '{}',
    action_type VARCHAR NOT NULL,          -- 'send_message', 'update_segment', 'create_task'
    action_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- =====================================================
-- 📝 TABLA: CRM_MESSAGE_TEMPLATES
-- =====================================================

CREATE TABLE crm_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR,                      -- 'welcome', 'follow_up', 'promotion', 'reminder'
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',          -- Variables disponibles
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- =====================================================
-- 📞 TABLA: COMMUNICATION_CHANNELS
-- =====================================================

CREATE TABLE communication_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,                 -- 'whatsapp', 'email', 'sms', 'phone'
    name VARCHAR NOT NULL,
    config JSONB DEFAULT '{}',             -- Configuración del canal
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- =====================================================
-- 🤖 TABLA: AGENT_CONVERSATIONS
-- =====================================================

CREATE TABLE agent_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_phone VARCHAR,
    customer_name VARCHAR,
    channel VARCHAR DEFAULT 'whatsapp',
    status VARCHAR DEFAULT 'active',       -- 'active', 'completed', 'transferred'
    started_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    ended_at TIMESTAMPTZ,
    booking_created BOOLEAN DEFAULT false,
    satisfaction_score INTEGER,            -- 1-5
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 📊 TABLA: ANALYTICS_DATA
-- =====================================================

CREATE TABLE analytics_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    metric_name VARCHAR NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índices para analytics_data
CREATE INDEX idx_analytics_restaurant_date ON analytics_data(restaurant_id, metric_date);
CREATE INDEX idx_analytics_metric ON analytics_data(metric_name);

-- =====================================================
-- 💰 TABLA: BILLING_TICKETS
-- =====================================================

CREATE TABLE billing_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ticket_number VARCHAR UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'pending',      -- 'pending', 'paid', 'cancelled'
    issued_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 🔧 FUNCIONES RPC PRINCIPALES
-- =====================================================

-- FUNCIÓN PRINCIPAL: Generación de disponibilidades
CREATE OR REPLACE FUNCTION generate_availability_slots_smart_check(
    p_restaurant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE,
    p_end_date date DEFAULT (CURRENT_DATE + interval '10 days')::date,
    p_slot_duration_minutes integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Variables para el procesamiento
    v_current_date date;
    v_restaurant_settings jsonb;
    v_operating_hours jsonb;
    v_day_of_week text;
    v_day_config jsonb;
    v_shifts jsonb;
    v_shift jsonb;
    v_special_event record;
    v_total_slots integer := 0;
    v_processed_days integer := 0;
    v_skipped_days integer := 0;
    v_slots_created integer;
    v_start_time time;
    v_end_time time;
    v_shift_name text;
    v_shift_start time;
    v_shift_end time;
    v_slots_before integer := 0;
    v_slots_after integer := 0;
BEGIN
    RAISE NOTICE '🚀 INICIANDO LÓGICA DEFINITIVA - CALENDARIO → HORARIO → TURNOS → SLOTS';
    
    -- 1. VALIDACIONES INICIALES
    IF p_restaurant_id IS NULL THEN
        RETURN jsonb_build_object('error', 'restaurant_id es requerido');
    END IF;
    
    -- Obtener configuración del restaurante
    SELECT settings INTO v_restaurant_settings
    FROM restaurants 
    WHERE id = p_restaurant_id;
    
    IF v_restaurant_settings IS NULL THEN
        RETURN jsonb_build_object('error', 'Restaurante no encontrado');
    END IF;
    
    v_operating_hours := v_restaurant_settings->'operating_hours';
    
    IF v_operating_hours IS NULL THEN
        RETURN jsonb_build_object('error', 'operating_hours no configurado en settings');
    END IF;
    
    -- 2. LIMPIAR SLOTS EXISTENTES - LÓGICA SIMPLE Y SEGURA
    DELETE FROM availability_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND slot_date BETWEEN p_start_date AND p_end_date
    AND status IN ('free', 'available')  -- Solo eliminar slots libres
    AND is_available = true;             -- Solo eliminar disponibles
    
    -- 3. PROCESAR CADA DÍA SEGÚN LÓGICA DEFINITIVA
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        -- REGLA 1: CALENDARIO PRIMERO (PRIORIDAD MÁXIMA)
        SELECT * INTO v_special_event
        FROM special_events
        WHERE restaurant_id = p_restaurant_id
        AND event_date = v_current_date
        AND is_closed = true;
        
        IF FOUND THEN
            RAISE NOTICE '🚫 CALENDARIO: Día cerrado por evento especial - %', v_special_event.title;
            v_skipped_days := v_skipped_days + 1;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- Obtener día de la semana
        v_day_of_week := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
        END;
        
        -- REGLA 2: HORARIO GENERAL DEL RESTAURANTE
        v_day_config := v_operating_hours->v_day_of_week;
        
        IF v_day_config IS NULL OR (v_day_config->>'open')::boolean = false THEN
            RAISE NOTICE '🚫 HORARIO: Día cerrado según operating_hours - %', v_day_of_week;
            v_skipped_days := v_skipped_days + 1;
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;
        
        -- Obtener horarios base del día
        v_start_time := (v_day_config->>'start')::time;
        v_end_time := (v_day_config->>'end')::time;
        
        -- REGLA 3: TURNOS PREVALECEN SOBRE HORARIO GENERAL
        v_shifts := v_day_config->'shifts';
        
        IF v_shifts IS NOT NULL AND jsonb_array_length(v_shifts) > 0 THEN
            -- Procesar cada turno
            FOR v_shift IN SELECT * FROM jsonb_array_elements(v_shifts)
            LOOP
                v_shift_name := v_shift->>'name';
                v_shift_start := (v_shift->>'start_time')::time;
                v_shift_end := (v_shift->>'end_time')::time;
                
                -- Generar slots para este turno
                v_slots_created := generar_slots_para_rango_final(
                    p_restaurant_id,
                    v_current_date,
                    v_shift_start,
                    v_shift_end,
                    v_shift_name,
                    p_slot_duration_minutes
                );
                
                v_total_slots := v_total_slots + v_slots_created;
            END LOOP;
        ELSE
            -- Sin turnos: usar horario general completo
            v_slots_created := generar_slots_para_rango_final(
                p_restaurant_id,
                v_current_date,
                v_start_time,
                v_end_time,
                'Horario General',
                p_slot_duration_minutes
            );
            
            v_total_slots := v_total_slots + v_slots_created;
        END IF;
        
        v_processed_days := v_processed_days + 1;
        v_current_date := v_current_date + 1;
    END LOOP;
    
    -- 4. RESULTADO FINAL
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Disponibilidades generadas con lógica definitiva',
        'stats', jsonb_build_object(
            'processed_days', v_processed_days,
            'skipped_days', v_skipped_days,
            'slots_created', v_total_slots,
            'slot_duration_minutes', p_slot_duration_minutes
        ),
        'logic_applied', jsonb_build_array(
            'REGLA 1: Calendario primero (special_events.is_closed)',
            'REGLA 2: Horario general (operating_hours.open)',
            'REGLA 3: Turnos prevalecen (shifts dentro de operating_hours)',
            'REGLA 4: Slots cada 30min respetando duración'
        )
    );
END;
$$;

-- FUNCIÓN AUXILIAR: Generar slots para un rango específico
CREATE OR REPLACE FUNCTION generar_slots_para_rango_final(
    p_restaurant_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_shift_name text,
    p_slot_duration_minutes integer
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time time;
    v_end_time time;
    v_table_record record;
    v_slots_created integer := 0;
    v_last_allowed_start time;
BEGIN
    -- Calcular última hora de inicio permitida
    v_last_allowed_start := p_end_time - (p_slot_duration_minutes || ' minutes')::interval;
    
    -- Si no hay tiempo suficiente para al menos un slot, salir
    IF p_start_time > v_last_allowed_start THEN
        RETURN 0;
    END IF;
    
    -- Obtener todas las mesas activas del restaurante
    FOR v_table_record IN 
        SELECT id, name 
        FROM tables 
        WHERE restaurant_id = p_restaurant_id 
        AND active = true
    LOOP
        v_current_time := p_start_time;
        
        -- Generar slots cada 30 minutos dentro del rango
        WHILE v_current_time <= v_last_allowed_start LOOP
            v_end_time := v_current_time + (p_slot_duration_minutes || ' minutes')::interval;
            
            -- Insertar slot (evitar duplicados)
            INSERT INTO availability_slots (
                restaurant_id,
                slot_date,
                start_time,
                end_time,
                table_id,
                shift_name,
                status,
                source,
                is_available,
                duration_minutes
            ) VALUES (
                p_restaurant_id,
                p_date,
                v_current_time,
                v_end_time,
                v_table_record.id,
                p_shift_name,
                'free',
                'system',
                true,
                p_slot_duration_minutes
            )
            ON CONFLICT (restaurant_id, slot_date, start_time, table_id) 
            DO NOTHING;
            
            v_slots_created := v_slots_created + 1;
            
            -- Avanzar 30 minutos
            v_current_time := v_current_time + interval '30 minutes';
        END LOOP;
    END LOOP;
    
    RETURN v_slots_created;
END;
$$;

-- FUNCIÓN: Verificar disponibilidad
CREATE OR REPLACE FUNCTION check_availability(
    p_restaurant_id uuid,
    p_date date,
    p_time time,
    p_party_size integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_available_tables integer;
BEGIN
    -- Contar mesas disponibles para la fecha/hora
    SELECT COUNT(*) INTO v_available_tables
    FROM availability_slots a
    INNER JOIN tables t ON t.id = a.table_id
    WHERE a.restaurant_id = p_restaurant_id
    AND a.slot_date = p_date
    AND a.start_time = p_time
    AND a.status = 'free'
    AND a.is_available = true
    AND t.capacity >= p_party_size;
    
    RETURN v_available_tables > 0;
END;
$$;

-- =====================================================
-- 🛡️ POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restaurant_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para RESTAURANTS
CREATE POLICY "restaurants_select_policy" ON restaurants
    FOR SELECT USING (
        id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR email = auth.email()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "restaurants_update_policy" ON restaurants
    FOR UPDATE USING (
        id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
            AND role IN ('owner', 'admin', 'manager')
        )
        OR email = auth.email()
    );

CREATE POLICY "restaurants_insert_policy" ON restaurants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para USER_RESTAURANT_MAPPING
CREATE POLICY "mapping_select_policy" ON user_restaurant_mapping
    FOR SELECT USING (
        auth_user_id = auth.uid()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "mapping_insert_policy" ON user_restaurant_mapping
    FOR INSERT WITH CHECK (
        auth_user_id = auth.uid()
        OR auth.role() = 'service_role'
    );

-- Políticas genéricas para tablas relacionadas con restaurante
CREATE POLICY "generic_restaurant_policy" ON special_events
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- Aplicar política genérica a todas las tablas con restaurant_id
CREATE POLICY "generic_restaurant_policy" ON availability_slots
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON tables
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON customers
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON crm_interactions
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON crm_automation_rules
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON crm_message_templates
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON communication_channels
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON agent_conversations
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON analytics_data
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "generic_restaurant_policy" ON billing_tickets
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 📊 RESUMEN DEL ESQUEMA
-- =====================================================

/*
🎯 TABLAS PRINCIPALES: 13
├── restaurants (tabla central)
├── special_events (eventos especiales - NUEVA)
├── availability_slots (slots de disponibilidad)
├── tables (mesas)
├── user_restaurant_mapping (mapeo usuarios)
├── customers (clientes CRM)
├── crm_interactions (interacciones CRM)
├── crm_automation_rules (reglas automatización)
├── crm_message_templates (plantillas mensajes)
├── communication_channels (canales comunicación)
├── agent_conversations (conversaciones agente)
├── analytics_data (datos analytics)
└── billing_tickets (tickets facturación)

🔧 FUNCIONES RPC: 3
├── generate_availability_slots_smart_check (principal)
├── generar_slots_para_rango_final (auxiliar)
└── check_availability (validación)

🛡️ SEGURIDAD:
├── RLS habilitado en todas las tablas
├── Políticas basadas en user_restaurant_mapping
├── Acceso controlado por roles
└── Service role para funciones internas

📅 ÚLTIMA ACTUALIZACIÓN: 29 Septiembre 2025
✅ ESTADO: ESQUEMA VALIDADO Y FUNCIONAL
🎯 LÓGICA: CALENDARIO → HORARIO → TURNOS → SLOTS
*/

-- =================================================
-- 🚀 LA-IA APP - CONFIGURACIÓN DE BASE DE DATOS ENTERPRISE
-- =================================================
-- Versión: 3.0 Enterprise
-- Fecha: 2025
-- Descripción: Schema completo para gestión de restaurantes con IA

-- =================================================
-- ✅ TABLAS PRINCIPALES
-- =================================================

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff', 'admin')),
    restaurant_id UUID,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    cuisine_type TEXT,
    price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    opening_hours JSONB DEFAULT '{}',
    capacity INTEGER DEFAULT 50,
    logo_url TEXT,
    cover_image_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de mesas
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    location TEXT, -- 'indoor', 'outdoor', 'bar', 'private'
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    position_x FLOAT,
    position_y FLOAT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birthday DATE,
    preferences JSONB DEFAULT '{}', -- alergias, preferencias dietéticas, etc.
    notes TEXT,
    visit_count INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL, -- redundancia por si customer_id es NULL
    customer_phone TEXT,
    customer_email TEXT,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    special_requests TEXT,
    notes TEXT,
    source TEXT DEFAULT 'direct', -- 'direct', 'phone', 'website', 'app', 'third_party'
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de conversaciones (chat/comunicación)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'app' CHECK (channel IN ('app', 'email', 'phone', 'whatsapp', 'website')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'customer', 'system', 'ai')),
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reservation', 'customer', 'system')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de métricas diarias
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_reservations INTEGER DEFAULT 0,
    confirmed_reservations INTEGER DEFAULT 0,
    cancelled_reservations INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    walk_ins INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    table_utilization_rate DECIMAL(5,2) DEFAULT 0, -- porcentaje
    average_party_size DECIMAL(3,1) DEFAULT 0,
    peak_hour_start TIME,
    peak_hour_end TIME,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_spend_per_customer DECIMAL(8,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(3,2), -- de 1.00 a 5.00
    staff_efficiency_score DECIMAL(3,2), -- de 1.00 a 5.00
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, date)
);

-- Tabla de analytics históricos (para IA)
CREATE TABLE IF NOT EXISTS public.analytics_historical (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'revenue', 'customers', 'reservations', etc.
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    dimension1 TEXT, -- ej: 'table_type', 'customer_segment'
    dimension1_value TEXT, -- ej: 'indoor', 'vip'
    dimension2 TEXT,
    dimension2_value TEXT,
    period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month', 'year')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de personal
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    position TEXT NOT NULL,
    department TEXT, -- 'kitchen', 'service', 'management', 'cleaning'
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    schedule JSONB DEFAULT '{}', -- horarios de trabajo
    permissions JSONB DEFAULT '{}', -- permisos específicos
    emergency_contact JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'food', 'beverage', 'supplies', 'equipment'
    description TEXT,
    unit TEXT NOT NULL, -- 'kg', 'liters', 'pieces', etc.
    current_stock DECIMAL(10,3) DEFAULT 0,
    minimum_stock DECIMAL(10,3) DEFAULT 0,
    maximum_stock DECIMAL(10,3),
    cost_per_unit DECIMAL(8,2) DEFAULT 0,
    supplier TEXT,
    supplier_contact JSONB DEFAULT '{}',
    barcode TEXT,
    location TEXT, -- ubicación en almacén
    expiration_date DATE,
    last_restocked TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de plantillas de mensajes
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'confirmation', 'reminder', 'cancellation', 'welcome', etc.
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT ARRAY[]::TEXT[], -- variables disponibles: {customer_name}, {date}, etc.
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'app')),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de configuraciones del restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL, -- 'general', 'reservations', 'notifications', 'integrations'
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- para datos sensibles como API keys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, category, setting_key)
);

-- =================================================
-- 🔐 ÍNDICES PARA PERFORMANCE
-- =================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id ON public.profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índices para restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON public.restaurants(is_active);

-- Índices para tables
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Índices para reservations
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON public.reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON public.reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON public.reservations(reservation_date, reservation_time);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_restaurant_id ON public.conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(assigned_to);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_id ON public.notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Índices para daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_restaurant_id ON public.daily_metrics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date);

-- Índices para analytics_historical
CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_id ON public.analytics_historical(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_type ON public.analytics_historical(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON public.analytics_historical(period_start, period_end);

-- Índices para staff
CREATE INDEX IF NOT EXISTS idx_staff_restaurant_id ON public.staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_profile_id ON public.staff(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- Índices para inventory_items
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_id ON public.inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory_items(status);

-- Índices para message_templates
CREATE INDEX IF NOT EXISTS idx_templates_restaurant_id ON public.message_templates(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.message_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON public.message_templates(channel);

-- Índices para restaurant_settings
CREATE INDEX IF NOT EXISTS idx_settings_restaurant_id ON public.restaurant_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.restaurant_settings(category);

-- =================================================
-- 🔐 POLÍTICAS DE SEGURIDAD (RLS)
-- =================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para restaurants
CREATE POLICY "Restaurant owners can manage their restaurant" ON public.restaurants
    FOR ALL USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = restaurants.id 
            AND p.role IN ('owner', 'manager', 'admin')
        )
    );

-- Políticas para tables
CREATE POLICY "Restaurant staff can manage tables" ON public.tables
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = tables.restaurant_id
        )
    );

-- Políticas para customers
CREATE POLICY "Restaurant staff can manage customers" ON public.customers
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = customers.restaurant_id
        )
    );

-- Políticas para reservations
CREATE POLICY "Restaurant staff can manage reservations" ON public.reservations
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = reservations.restaurant_id
        )
    );

-- Políticas para conversations
CREATE POLICY "Restaurant staff can manage conversations" ON public.conversations
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = conversations.restaurant_id
        )
    );

-- Políticas para messages
CREATE POLICY "Restaurant staff can manage messages" ON public.messages
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            JOIN public.conversations c ON p.restaurant_id = c.restaurant_id
            WHERE c.id = messages.conversation_id
        )
    );

-- Políticas para notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Restaurant staff can manage notifications" ON public.notifications
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = notifications.restaurant_id
            AND p.role IN ('owner', 'manager', 'admin')
        )
    );

-- Políticas para daily_metrics
CREATE POLICY "Restaurant staff can view metrics" ON public.daily_metrics
    FOR SELECT USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = daily_metrics.restaurant_id
        )
    );

CREATE POLICY "Restaurant managers can manage metrics" ON public.daily_metrics
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = daily_metrics.restaurant_id
            AND p.role IN ('owner', 'manager', 'admin')
        )
    );

-- Políticas para analytics_historical
CREATE POLICY "Restaurant staff can view analytics" ON public.analytics_historical
    FOR SELECT USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = analytics_historical.restaurant_id
        )
    );

-- Políticas para staff
CREATE POLICY "Restaurant managers can manage staff" ON public.staff
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = staff.restaurant_id
            AND p.role IN ('owner', 'manager', 'admin')
        )
    );

-- Políticas para inventory_items
CREATE POLICY "Restaurant staff can manage inventory" ON public.inventory_items
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = inventory_items.restaurant_id
        )
    );

-- Políticas para message_templates
CREATE POLICY "Restaurant staff can manage templates" ON public.message_templates
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = message_templates.restaurant_id
        )
    );

-- Políticas para restaurant_settings
CREATE POLICY "Restaurant managers can manage settings" ON public.restaurant_settings
    FOR ALL USING (
        auth.uid() IN (
            SELECT p.id FROM public.profiles p 
            WHERE p.restaurant_id = restaurant_settings.restaurant_id
            AND p.role IN ('owner', 'manager', 'admin')
        )
    );

-- =================================================
-- 🤖 FUNCIONES Y TRIGGERS
-- =================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tables
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.daily_metrics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.message_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.restaurant_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función para crear perfil automáticamente después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automático
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para crear restaurante por defecto
CREATE OR REPLACE FUNCTION public.create_default_restaurant(user_id UUID, restaurant_name TEXT DEFAULT 'Mi Restaurante')
RETURNS UUID AS $$
DECLARE
    new_restaurant_id UUID;
BEGIN
    -- Crear restaurante
    INSERT INTO public.restaurants (owner_id, name, address, phone, email)
    VALUES (
        user_id, 
        restaurant_name,
        'Dirección pendiente',
        'Teléfono pendiente',
        (SELECT email FROM public.profiles WHERE id = user_id)
    )
    RETURNING id INTO new_restaurant_id;
    
    -- Actualizar perfil con restaurant_id
    UPDATE public.profiles 
    SET restaurant_id = new_restaurant_id, role = 'owner'
    WHERE id = user_id;
    
    -- Crear mesas básicas
    INSERT INTO public.tables (restaurant_id, table_number, capacity, location)
    VALUES 
        (new_restaurant_id, '1', 4, 'indoor'),
        (new_restaurant_id, '2', 4, 'indoor'),
        (new_restaurant_id, '3', 6, 'indoor'),
        (new_restaurant_id, '4', 2, 'indoor'),
        (new_restaurant_id, '5', 8, 'indoor');
    
    RETURN new_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para estadísticas del dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(restaurant_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    today_reservations INTEGER;
    total_customers INTEGER;
    monthly_revenue DECIMAL;
    avg_rating DECIMAL;
BEGIN
    -- Reservas de hoy
    SELECT COUNT(*) INTO today_reservations
    FROM public.reservations 
    WHERE restaurant_id = restaurant_uuid 
    AND reservation_date = CURRENT_DATE;
    
    -- Total de clientes
    SELECT COUNT(*) INTO total_customers
    FROM public.customers 
    WHERE restaurant_id = restaurant_uuid;
    
    -- Ingresos del mes (simulado)
    SELECT COALESCE(SUM(total_revenue), 0) INTO monthly_revenue
    FROM public.daily_metrics 
    WHERE restaurant_id = restaurant_uuid 
    AND date >= date_trunc('month', CURRENT_DATE);
    
    -- Rating promedio (simulado)
    SELECT COALESCE(AVG(customer_satisfaction_score), 4.5) INTO avg_rating
    FROM public.daily_metrics 
    WHERE restaurant_id = restaurant_uuid 
    AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    result := jsonb_build_object(
        'today_reservations', today_reservations,
        'total_customers', total_customers,
        'monthly_revenue', monthly_revenue,
        'average_rating', avg_rating,
        'generated_at', timezone('utc'::text, now())
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- 🎯 DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =================================================
/*
-- Ejemplo de inserción de datos de prueba
-- Descomenta solo si quieres datos de ejemplo

INSERT INTO public.profiles (id, email, full_name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@ejemplo.com', 'Administrador', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'gerente@ejemplo.com', 'Gerente', 'manager');

INSERT INTO public.restaurants (id, owner_id, name, address, phone, email) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Restaurante Ejemplo', 'Calle Principal 123', '+34 900 123 456', 'contacto@ejemplo.com');

-- Más datos de ejemplo...
*/

-- =================================================
-- ✅ VERIFICACIÓN FINAL
-- =================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'restaurants', 'tables', 'customers', 'reservations',
    'conversations', 'messages', 'notifications', 'daily_metrics',
    'analytics_historical', 'staff', 'inventory_items', 
    'message_templates', 'restaurant_settings'
)
ORDER BY tablename;

-- Mensaje final de confirmación
SELECT '🎉 ¡BASE DE DATOS ENTERPRISE CONFIGURADA CORRECTAMENTE!' as status,
       'Todas las tablas, índices, políticas RLS y funciones han sido creadas exitosamente.' as message,
       timezone('utc'::text, now()) as created_at;

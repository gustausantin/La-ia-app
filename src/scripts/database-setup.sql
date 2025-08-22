-- =================================================
-- 🗄️ SETUP COMPLETO DE BASE DE DATOS SUPABASE
-- Script para crear todas las tablas necesarias
-- =================================================

-- Habilitar Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =================================================
-- 👥 TABLA DE PERFILES DE USUARIO
-- =================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'owner')),
    permissions JSONB DEFAULT '[]'::jsonb,
    restaurant_id UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 🏪 TABLA DE RESTAURANTES
-- =================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{
        "timezone": "Europe/Madrid",
        "currency": "EUR",
        "language": "es",
        "max_capacity": 100,
        "avg_service_time": 90
    }'::jsonb,
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "23:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "23:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "23:00", "closed": false},
        "thursday": {"open": "09:00", "close": "23:00", "closed": false},
        "friday": {"open": "09:00", "close": "24:00", "closed": false},
        "saturday": {"open": "09:00", "close": "24:00", "closed": false},
        "sunday": {"open": "10:00", "close": "22:00", "closed": false}
    }'::jsonb,
    active BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 🪑 TABLA DE MESAS
-- =================================================
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    location TEXT, -- 'indoor', 'outdoor', 'bar', 'private'
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    shape TEXT DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle')),
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

-- =================================================
-- 👥 TABLA DE CLIENTES
-- =================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    birthday DATE,
    preferences JSONB DEFAULT '{}'::jsonb,
    allergies TEXT[],
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    last_visit TIMESTAMP WITH TIME ZONE,
    vip_status BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 📅 TABLA DE RESERVAS
-- =================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    special_requests TEXT,
    notes TEXT,
    confirmation_code TEXT UNIQUE,
    reminder_sent BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 💬 TABLA DE CONVERSACIONES
-- =================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'phone', 'email', 'sms')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subject TEXT,
    unread_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 💬 TABLA DE MENSAJES
-- =================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'staff', 'ai', 'system')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video', 'location')),
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 🔔 TABLA DE NOTIFICACIONES
-- =================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('reservation', 'message', 'payment', 'inventory', 'staff', 'system', 'marketing')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    actions JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 📊 TABLA DE MÉTRICAS DIARIAS
-- =================================================
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{
        "revenue": 0,
        "customers": 0,
        "reservations": 0,
        "average_wait_time": 0,
        "customer_satisfaction": 0,
        "staff_on_duty": 0,
        "table_rotation": 0,
        "no_shows": 0,
        "cancellations": 0
    }'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, date)
);

-- =================================================
-- 📈 TABLA DE DATOS HISTÓRICOS PARA IA
-- =================================================
CREATE TABLE IF NOT EXISTS public.analytics_historical (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    hour INTEGER,
    value DECIMAL(15,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    INDEX(restaurant_id, type, date)
);

-- =================================================
-- 👨‍💼 TABLA DE PERSONAL
-- =================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT,
    position TEXT NOT NULL,
    department TEXT,
    hire_date DATE,
    hourly_rate DECIMAL(8,2),
    schedule JSONB DEFAULT '{}'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 📦 TABLA DE INVENTARIO
-- =================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    sku TEXT,
    current_stock DECIMAL(10,3),
    min_stock_level DECIMAL(10,3),
    max_stock_level DECIMAL(10,3),
    unit TEXT DEFAULT 'units',
    cost_per_unit DECIMAL(10,2),
    supplier TEXT,
    expiry_date DATE,
    location TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 📝 TABLA DE PLANTILLAS DE MENSAJES
-- =================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    usage_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 🔧 TABLA DE CONFIGURACIÓN DEL RESTAURANTE
-- =================================================
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
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

-- Políticas para perfiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para restaurantes (los usuarios solo ven su restaurante)
CREATE POLICY "Users can view own restaurant" ON public.restaurants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = restaurants.id
    )
);

-- Política general: los usuarios solo ven datos de su restaurante
CREATE POLICY "Users can view own restaurant data" ON public.tables FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = tables.restaurant_id
    )
);

CREATE POLICY "Users can view own restaurant customers" ON public.customers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = customers.restaurant_id
    )
);

CREATE POLICY "Users can view own restaurant reservations" ON public.reservations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = reservations.restaurant_id
    )
);

CREATE POLICY "Users can view own restaurant conversations" ON public.conversations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.restaurant_id = conversations.restaurant_id
    )
);

CREATE POLICY "Users can view own restaurant messages" ON public.messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        JOIN public.profiles ON profiles.restaurant_id = conversations.restaurant_id
        WHERE profiles.id = auth.uid() 
        AND conversations.id = messages.conversation_id
    )
);

-- =================================================
-- 🔄 FUNCIONES Y TRIGGERS
-- =================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.daily_metrics FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =================================================
-- 🎲 DATOS DE EJEMPLO (OPCIONAL)
-- =================================================

-- Insertar restaurante de ejemplo
INSERT INTO public.restaurants (id, name, description, address, phone, email) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Restaurante Demo LA-IA',
    'Restaurante de demostración para LA-IA App',
    'Calle Ejemplo 123, Madrid',
    '+34 123 456 789',
    'demo@la-ia-app.com'
) ON CONFLICT DO NOTHING;

-- Insertar mesas de ejemplo
INSERT INTO public.tables (restaurant_id, table_number, capacity, location) VALUES
('00000000-0000-0000-0000-000000000001', 'M01', 2, 'indoor'),
('00000000-0000-0000-0000-000000000001', 'M02', 4, 'indoor'),
('00000000-0000-0000-0000-000000000001', 'M03', 4, 'indoor'),
('00000000-0000-0000-0000-000000000001', 'M04', 6, 'indoor'),
('00000000-0000-0000-0000-000000000001', 'T01', 2, 'outdoor'),
('00000000-0000-0000-0000-000000000001', 'T02', 4, 'outdoor'),
('00000000-0000-0000-0000-000000000001', 'B01', 2, 'bar'),
('00000000-0000-0000-0000-000000000001', 'B02', 2, 'bar')
ON CONFLICT DO NOTHING;

-- Insertar plantillas de mensajes
INSERT INTO public.message_templates (restaurant_id, name, content, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Saludo inicial', '¡Hola! ¿En qué puedo ayudarte hoy?', 'greeting'),
('00000000-0000-0000-0000-000000000001', 'Confirmación reserva', 'Tu reserva ha sido confirmada para {fecha} a las {hora}.', 'reservation'),
('00000000-0000-0000-0000-000000000001', 'Recordatorio reserva', 'Te recordamos tu reserva para hoy a las {hora}.', 'reminder'),
('00000000-0000-0000-0000-000000000001', 'Agradecimiento', 'Gracias por visitarnos. ¡Esperamos verte pronto!', 'thanks')
ON CONFLICT DO NOTHING;

-- =================================================
-- 📋 COMENTARIOS Y DOCUMENTACIÓN
-- =================================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos';
COMMENT ON TABLE public.restaurants IS 'Información de restaurantes';
COMMENT ON TABLE public.tables IS 'Mesas del restaurante';
COMMENT ON TABLE public.customers IS 'Base de datos de clientes';
COMMENT ON TABLE public.reservations IS 'Sistema de reservas';
COMMENT ON TABLE public.conversations IS 'Conversaciones de atención al cliente';
COMMENT ON TABLE public.messages IS 'Mensajes dentro de conversaciones';
COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones';
COMMENT ON TABLE public.daily_metrics IS 'Métricas diarias para analytics';
COMMENT ON TABLE public.analytics_historical IS 'Datos históricos para IA y analytics';
COMMENT ON TABLE public.staff IS 'Gestión de personal';
COMMENT ON TABLE public.inventory_items IS 'Control de inventario';
COMMENT ON TABLE public.message_templates IS 'Plantillas de mensajes predefinidos';
COMMENT ON TABLE public.restaurant_settings IS 'Configuraciones específicas del restaurante';

-- =================================================
-- ✅ VERIFICACIÓN DE INSTALACIÓN
-- =================================================

-- Función para verificar que todas las tablas estén creadas
CREATE OR REPLACE FUNCTION public.verify_database_setup()
RETURNS TABLE(table_name TEXT, exists BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        CASE WHEN t.table_name IS NOT NULL THEN true ELSE false END as exists
    FROM 
        (VALUES 
            ('profiles'),
            ('restaurants'),
            ('tables'),
            ('customers'),
            ('reservations'),
            ('conversations'),
            ('messages'),
            ('notifications'),
            ('daily_metrics'),
            ('analytics_historical'),
            ('staff'),
            ('inventory_items'),
            ('message_templates'),
            ('restaurant_settings')
        ) AS expected(table_name)
    LEFT JOIN information_schema.tables t 
        ON t.table_name = expected.table_name 
        AND t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación
SELECT * FROM public.verify_database_setup();

-- =================================================
-- 🎉 ¡BASE DE DATOS LISTA PARA LA-IA APP!
-- =================================================

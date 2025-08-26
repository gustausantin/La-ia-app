-- ✅ HABILITAR RLS Y POLÍTICAS DE SEGURIDAD PARA LA-IA APP
-- Este script protege todas las tablas críticas con Row Level Security

-- =============================================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
-- =============================================================================

-- Tablas de negocio críticas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restaurant_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tablas de comunicación y analytics (solo las que existen)
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. POLÍTICAS PARA RESTAURANTS (BASE DE TODO)
-- =============================================================================

-- Política: Los usuarios solo pueden ver/editar SUS restaurantes
CREATE POLICY "Users can manage their own restaurants" ON public.restaurants
FOR ALL USING (
    id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 3. POLÍTICAS PARA USER_RESTAURANT_MAPPING (CRÍTICO)
-- =============================================================================

-- Política: Solo ver/editar sus propios mappings
CREATE POLICY "Users can manage their own mappings" ON public.user_restaurant_mapping
FOR ALL USING (auth_user_id = auth.uid());

-- =============================================================================
-- 4. POLÍTICAS PARA RESERVATIONS
-- =============================================================================

-- Política: Solo reservas de SUS restaurantes
CREATE POLICY "Users can manage reservations for their restaurants" ON public.reservations
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 5. POLÍTICAS PARA CUSTOMERS
-- =============================================================================

-- Política: Solo clientes de SUS restaurantes
CREATE POLICY "Users can manage customers for their restaurants" ON public.customers
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 6. POLÍTICAS PARA TABLES
-- =============================================================================

-- Política: Solo mesas de SUS restaurantes
CREATE POLICY "Users can manage tables for their restaurants" ON public.tables
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 7. POLÍTICAS PARA PROFILES
-- =============================================================================

-- Política: Solo su propio perfil
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (auth_user_id = auth.uid());

-- =============================================================================
-- 8. POLÍTICAS PARA CONVERSATIONS Y MESSAGES
-- =============================================================================

-- Conversaciones: Solo de SUS restaurantes (comentado hasta verificar estructura)
-- CREATE POLICY "Users can manage conversations for their restaurants" ON public.conversations
-- FOR ALL USING (
--     restaurant_id IN (
--         SELECT restaurant_id 
--         FROM public.user_restaurant_mapping 
--         WHERE auth_user_id = auth.uid() AND active = true
--     )
-- );

-- Mensajes: Solo de SUS restaurantes (ajustado a estructura real)
-- Comentado hasta verificar estructura de tabla messages
-- CREATE POLICY "Users can manage messages for their restaurants" ON public.messages
-- FOR ALL USING (
--     restaurant_id IN (
--         SELECT restaurant_id 
--         FROM public.user_restaurant_mapping 
--         WHERE auth_user_id = auth.uid() AND active = true
--     )
-- );

-- =============================================================================
-- 9. POLÍTICAS PARA ANALYTICS Y MÉTRICAS
-- =============================================================================

-- Analytics: Solo de SUS restaurantes
CREATE POLICY "Users can view analytics for their restaurants" ON public.analytics
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- Analytics históricos: Solo de SUS restaurantes
CREATE POLICY "Users can view historical analytics for their restaurants" ON public.analytics_historical
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- Métricas diarias: Solo de SUS restaurantes
CREATE POLICY "Users can view daily metrics for their restaurants" ON public.daily_metrics
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- Notificaciones: Solo de SUS restaurantes
CREATE POLICY "Users can manage notifications for their restaurants" ON public.notifications
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 10. PERMISOS ESPECIALES PARA RPC FUNCTIONS
-- =============================================================================

-- Permitir que usuarios autenticados ejecuten funciones seguras
GRANT EXECUTE ON FUNCTION public.create_restaurant_securely(JSONB, JSONB) TO authenticated;

-- =============================================================================
-- ✅ VERIFICACIÓN FINAL
-- =============================================================================

-- Comprobar que RLS está habilitado en todas las tablas críticas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'restaurants', 'user_restaurant_mapping', 'reservations', 
    'customers', 'tables', 'profiles', 'analytics', 'notifications'
);

-- Comprobar políticas creadas
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

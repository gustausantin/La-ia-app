-- ✅ LIMPIAR POLÍTICAS DUPLICADAS Y OPTIMIZAR
-- Este script elimina duplicados y estandariza lógicas

-- =============================================================================
-- 1. ELIMINAR POLÍTICAS DUPLICADAS O CONFLICTIVAS
-- =============================================================================

-- ANALYTICS: Mantener solo la política más específica
DROP POLICY IF EXISTS "analytics_restaurant_access" ON public.analytics;

-- CUSTOMERS: Mantener solo la política más específica  
DROP POLICY IF EXISTS "customer_restaurant_access" ON public.customers;

-- INVENTORY: Mantener solo política ALL, eliminar UPDATE específica
DROP POLICY IF EXISTS "Users can update inventory for their restaurants" ON public.inventory;

-- MESSAGES: Mantener solo política ALL, eliminar SELECT específica
DROP POLICY IF EXISTS "Users can read messages for their restaurants" ON public.messages;

-- RESERVATIONS: Eliminar políticas inconsistentes, mantener solo la principal
DROP POLICY IF EXISTS "reservation_restaurant_access" ON public.reservations;
DROP POLICY IF EXISTS "reservations_final" ON public.reservations;

-- RESTAURANTS: Eliminar políticas por email (inseguras), mantener mapping
DROP POLICY IF EXISTS "restaurants_final" ON public.restaurants;

-- PROFILES: Mantener solo la más segura
DROP POLICY IF EXISTS "profiles_enterprise" ON public.profiles;

-- USER_RESTAURANT_MAPPING: Mantener solo la más específica
DROP POLICY IF EXISTS "restaurant_mapping_access" ON public.user_restaurant_mapping;

-- STAFF: Mantener solo la política INSERT, eliminar conflictiva
DROP POLICY IF EXISTS "Users can manage staff for their restaurants" ON public.staff;

-- =============================================================================
-- 2. CREAR POLÍTICAS ENTERPRISE GRANULARES
-- =============================================================================

-- ANALYTICS: Políticas específicas por operación
CREATE POLICY "analytics_select" ON public.analytics
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

CREATE POLICY "analytics_insert" ON public.analytics  
FOR INSERT WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND active = true
    )
);

-- CUSTOMERS: Políticas con roles
CREATE POLICY "customers_owners_full" ON public.customers
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND active = true
    )
);

CREATE POLICY "customers_staff_read" ON public.customers
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager', 'staff') 
        AND active = true
    )
);

-- INVENTORY: Políticas por rol y operación
CREATE POLICY "inventory_managers_full" ON public.inventory
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND active = true
    )
);

-- MESSAGES: Políticas granulares
CREATE POLICY "messages_select_all_roles" ON public.messages
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

CREATE POLICY "messages_insert_managers" ON public.messages
FOR INSERT WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND active = true
    )
);

-- STAFF: Políticas específicas por operación
CREATE POLICY "staff_select_all" ON public.staff
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

CREATE POLICY "staff_modify_managers" ON public.staff
FOR INSERT WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND active = true
    )
);

-- =============================================================================
-- ✅ VERIFICACIÓN FINAL
-- =============================================================================

-- Contar políticas después de limpieza
SELECT 
    tablename,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 1 THEN '⚠️ POCAS POLÍTICAS'
        WHEN COUNT(*) BETWEEN 2 AND 4 THEN '✅ ÓPTIMO'
        ELSE '⚠️ DEMASIADAS POLÍTICAS'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies;

-- ✅ CREAR POLÍTICAS FALTANTES PARA TABLAS SIN PROTECCIÓN
-- Este script completa la seguridad RLS

-- =============================================================================
-- 1. POLÍTICAS PARA TABLAS SIN NINGUNA POLÍTICA
-- =============================================================================

-- CONVERSATIONS: Solo conversaciones de SUS restaurantes
CREATE POLICY "Users can manage conversations for their restaurants" ON public.conversations
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- INVENTORY_ITEMS: Solo inventario de SUS restaurantes
CREATE POLICY "Users can manage inventory items for their restaurants" ON public.inventory_items
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- MESSAGE_TEMPLATES: Solo plantillas de SUS restaurantes
CREATE POLICY "Users can manage message templates for their restaurants" ON public.message_templates
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- RESTAURANT_SETTINGS: Solo configuraciones de SUS restaurantes
CREATE POLICY "Users can manage settings for their restaurants" ON public.restaurant_settings
FOR ALL USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- 2. POLÍTICAS ADICIONALES PARA TABLAS CON POCAS POLÍTICAS
-- =============================================================================

-- MESSAGES: Política adicional para lectura específica
CREATE POLICY "Users can read messages for their restaurants" ON public.messages
FOR SELECT USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- STAFF: Política adicional para gestión de personal
CREATE POLICY "Users can manage staff for their restaurants" ON public.staff
FOR INSERT WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- INVENTORY: Política adicional para gestión de inventario
CREATE POLICY "Users can update inventory for their restaurants" ON public.inventory
FOR UPDATE USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.user_restaurant_mapping 
        WHERE auth_user_id = auth.uid() AND active = true
    )
);

-- =============================================================================
-- ✅ VERIFICACIÓN FINAL
-- =============================================================================

-- Verificar que ya no hay tablas sin políticas
SELECT 
    'TABLAS SIN POLÍTICAS DESPUÉS DEL FIX' as check_type,
    COUNT(DISTINCT t.tablename) as count,
    CASE 
        WHEN COUNT(DISTINCT t.tablename) = 0 THEN '✅ PERFECTO - TODAS PROTEGIDAS'
        ELSE '❌ AÚN HAY PROBLEMAS'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true 
    AND p.tablename IS NULL;

-- Mostrar resumen actualizado de políticas
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ SIN POLÍTICAS'
        WHEN COUNT(*) = 1 THEN '⚠️ 1 POLÍTICA'
        WHEN COUNT(*) = 2 THEN '✅ 2 POLÍTICAS'
        ELSE '✅ MÚLTIPLES POLÍTICAS'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies ASC, tablename;

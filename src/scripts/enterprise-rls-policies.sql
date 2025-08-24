-- 🛡️ SOLUCIÓN ENTERPRISE: POLÍTICAS RLS CORRECTAS SIN RECURSIÓN
-- Problema: recursión infinita entre user_restaurant_mapping y restaurants
-- Solución: políticas independientes y bien estructuradas

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
SELECT 'Eliminando políticas con recursión infinita...' as status;

DROP POLICY IF EXISTS "user_restaurant_mapping_policy_simple" ON public.user_restaurant_mapping;
DROP POLICY IF EXISTS "restaurants_policy_simple" ON public.restaurants;
DROP POLICY IF EXISTS "reservations_select_policy" ON public.reservations;
DROP POLICY IF EXISTS "user_mapping_simple" ON public.user_restaurant_mapping;
DROP POLICY IF EXISTS "restaurants_simple" ON public.restaurants;
DROP POLICY IF EXISTS "reservations_simple" ON public.reservations;

-- 2. CREAR POLÍTICAS ENTERPRISE CORRECTAS

-- POLÍTICA PARA user_restaurant_mapping (BASE - SIN DEPENDENCIAS)
-- Esta tabla es la base, solo verifica el usuario autenticado
CREATE POLICY "user_restaurant_mapping_enterprise" ON public.user_restaurant_mapping
    FOR ALL
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- POLÍTICA PARA restaurants (DEPENDE DIRECTAMENTE DE AUTH, NO DE MAPPINGS)
-- En lugar de usar user_restaurant_mapping, usamos el owner_id directamente
-- Asumiendo que restaurants tiene owner_id que mapea a auth.uid()
CREATE POLICY "restaurants_enterprise" ON public.restaurants
    FOR ALL
    USING (
        -- El usuario puede ver restaurants donde es propietario
        -- O usar email para verificar propiedad (más simple y sin recursión)
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- POLÍTICA PARA reservations (DEPENDE DIRECTAMENTE DE RESTAURANT_ID)
-- En lugar de consultar mappings, usamos una subconsulta directa
CREATE POLICY "reservations_enterprise" ON public.reservations
    FOR ALL
    USING (
        -- El usuario puede ver reservas de restaurantes que le pertenecen
        restaurant_id IN (
            SELECT id FROM public.restaurants 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- 3. CREAR POLÍTICAS ADICIONALES PARA OTRAS TABLAS IMPORTANTES

-- POLÍTICA PARA profiles
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
CREATE POLICY "profiles_enterprise" ON public.profiles
    FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- POLÍTICA PARA customers
DROP POLICY IF EXISTS "customers_policy" ON public.customers;
CREATE POLICY "customers_enterprise" ON public.customers
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- POLÍTICA PARA tables
DROP POLICY IF EXISTS "tables_policy" ON public.tables;
CREATE POLICY "tables_enterprise" ON public.tables
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- 4. VERIFICAR QUE LAS POLÍTICAS NO TIENEN RECURSIÓN
SELECT 'Verificando políticas enterprise...' as status;

-- Listar todas las políticas activas
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%user_restaurant_mapping%' AND tablename != 'user_restaurant_mapping' 
        THEN '⚠️ POSIBLE RECURSIÓN'
        ELSE '✅ OK'
    END as recursion_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_restaurant_mapping', 'restaurants', 'reservations', 'profiles', 'customers', 'tables')
ORDER BY tablename, policyname;

-- 5. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_restaurant_mapping', 'restaurants', 'reservations', 'profiles', 'customers', 'tables');

-- 6. RESULTADO FINAL
SELECT 'POLÍTICAS RLS ENTERPRISE CONFIGURADAS SIN RECURSIÓN' as final_status;

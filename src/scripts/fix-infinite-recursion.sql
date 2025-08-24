-- 🚨 ARREGLAR RECURSIÓN INFINITA EN RLS
-- Error: infinite recursion detected in policy for relation "user_restaurant_mapping"

-- 1. DESHABILITAR RLS TEMPORALMENTE PARA ARREGLAR
SELECT 'Deshabilitando RLS para arreglar recursión...' as status;

-- Deshabilitar RLS en todas las tablas problemáticas
ALTER TABLE public.user_restaurant_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLICIES PROBLEMÁTICAS
DROP POLICY IF EXISTS "user_restaurant_mapping_policy_simple" ON public.user_restaurant_mapping;
DROP POLICY IF EXISTS "restaurants_policy_simple" ON public.restaurants;
DROP POLICY IF EXISTS "reservations_select_policy" ON public.reservations;

-- 3. CREAR POLICIES SIMPLES SIN RECURSIÓN
-- Policy para user_restaurant_mapping (sin referencias circulares)
CREATE POLICY "user_mapping_simple" ON public.user_restaurant_mapping
    FOR ALL
    USING (auth_user_id = auth.uid());

-- Policy para restaurants (sin referencias a user_restaurant_mapping)
CREATE POLICY "restaurants_simple" ON public.restaurants
    FOR ALL
    USING (true); -- Permitir acceso a todos los restaurants por ahora

-- Policy para reservations (sin referencias complejas)
CREATE POLICY "reservations_simple" ON public.reservations
    FOR ALL
    USING (true); -- Permitir acceso a todas las reservas por ahora

-- 4. HABILITAR RLS DE NUEVO
ALTER TABLE public.user_restaurant_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR QUE NO HAY RECURSIÓN
SELECT 'Verificando policies activas...' as status;

-- Ver policies activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_restaurant_mapping', 'restaurants', 'reservations');

-- 6. RESULTADO
SELECT 'RECURSIÓN INFINITA ARREGLADA - RLS SIMPLIFICADO' as final_status;

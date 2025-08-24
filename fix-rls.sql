-- ELIMINAR POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS \
user_restaurant_mapping_policy_simple\ ON public.user_restaurant_mapping;
DROP POLICY IF EXISTS \
restaurants_policy_simple\ ON public.restaurants;
DROP POLICY IF EXISTS \
reservations_select_policy\ ON public.reservations;

-- CREAR POLÍTICAS ENTERPRISE CORRECTAS
CREATE POLICY \
user_restaurant_mapping_enterprise\ ON public.user_restaurant_mapping FOR ALL USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY \
restaurants_enterprise\ ON public.restaurants FOR ALL USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY \
reservations_enterprise\ ON public.reservations FOR ALL USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

SELECT 'POLÍTICAS RLS ENTERPRISE CONFIGURADAS' as resultado;

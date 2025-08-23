-- 🚨 PROTECCIÓN NUCLEAR CONTRA DUPLICADOS
-- SOLUCIÓN DEFINITIVA: Constraint en BD + Cleanup

-- 1. LIMPIAR TODOS LOS DUPLICADOS PRIMERO
SELECT 'Limpiando duplicados existentes...' as status;

-- Eliminar mappings de restaurants duplicados (mantener solo el más antiguo)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
    FROM restaurants 
    WHERE email = 'gustausantin@gmail.com'
)
DELETE FROM user_restaurant_mapping 
WHERE restaurant_id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Eliminar restaurants duplicados (mantener solo el más antiguo)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
    FROM restaurants 
    WHERE email = 'gustausantin@gmail.com'
)
DELETE FROM restaurants 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 2. CREAR CONSTRAINT ÚNICO PARA PREVENIR DUPLICADOS
SELECT 'Creando constraint único...' as status;

-- Agregar constraint único en user_restaurant_mapping
ALTER TABLE public.user_restaurant_mapping 
DROP CONSTRAINT IF EXISTS unique_user_restaurant;

ALTER TABLE public.user_restaurant_mapping 
ADD CONSTRAINT unique_user_restaurant 
UNIQUE (auth_user_id);

-- 3. CREAR FUNCIÓN SEGURA QUE NO PERMITE DUPLICADOS
CREATE OR REPLACE FUNCTION create_restaurant_safe(
    user_id UUID,
    user_email TEXT,
    restaurant_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_profile_id UUID;
    new_restaurant_id UUID;
    existing_mapping_count INTEGER;
BEGIN
    -- VERIFICAR si ya existe mapping para este usuario
    SELECT COUNT(*) INTO existing_mapping_count
    FROM public.user_restaurant_mapping 
    WHERE auth_user_id = user_id;
    
    -- Si ya existe, retornar error
    IF existing_mapping_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User already has a restaurant',
            'existing_count', existing_mapping_count
        );
    END IF;
    
    -- CREAR PROFILE si no existe
    INSERT INTO public.profiles (id, email, full_name, restaurant_name, role)
    VALUES (user_id, user_email, user_email, restaurant_name, 'owner')
    ON CONFLICT (id) DO UPDATE SET
        restaurant_name = EXCLUDED.restaurant_name,
        role = 'owner',
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO new_profile_id;
    
    -- CREAR RESTAURANT
    INSERT INTO public.restaurants (name, email, phone, city, country, plan, active)
    VALUES (restaurant_name, user_email, '+34 600 000 000', 'Madrid', 'España', 'trial', true)
    RETURNING id INTO new_restaurant_id;
    
    -- CREAR MAPPING (con constraint único)
    INSERT INTO public.user_restaurant_mapping (auth_user_id, restaurant_id, role, active)
    VALUES (user_id, new_restaurant_id, 'owner', true);
    
    -- RETORNAR ÉXITO
    RETURN jsonb_build_object(
        'success', true,
        'profile_id', new_profile_id,
        'restaurant_id', new_restaurant_id,
        'message', 'Restaurant created successfully'
    );
    
EXCEPTION WHEN unique_violation THEN
    -- Si hay violación de constraint único, retornar error
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Duplicate restaurant creation prevented by database constraint'
    );
END;
$$;

-- 4. VERIFICAR ESTADO FINAL
SELECT 'Verificando estado final...' as status;

-- Contar restaurants para este usuario
SELECT COUNT(*) as total_restaurants_for_user 
FROM restaurants 
WHERE email = 'gustausantin@gmail.com';

-- Contar mappings para este usuario  
SELECT COUNT(*) as total_mappings_for_user
FROM user_restaurant_mapping urm
JOIN auth.users u ON urm.auth_user_id = u.id
WHERE u.email = 'gustausantin@gmail.com';

-- 5. RESULTADO
SELECT 'PROTECCIÓN NUCLEAR ACTIVADA - DUPLICADOS IMPOSIBLES' as final_status;

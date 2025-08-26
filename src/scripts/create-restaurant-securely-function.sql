-- ✅ FUNCIÓN ENTERPRISE: create_restaurant_securely
-- Para crear restaurants automáticamente durante login/registro

CREATE OR REPLACE FUNCTION public.create_restaurant_securely(
    restaurant_data JSONB,
    user_profile JSONB DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_restaurant_id UUID;
    v_restaurant_name TEXT;
    v_restaurant_email TEXT;
    existing_mapping_count INTEGER;
BEGIN
    -- Verificar que hay usuario autenticado
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No authenticated user'
        );
    END IF;
    
    -- Verificar si ya existe mapping para este usuario
    SELECT COUNT(*) INTO existing_mapping_count
    FROM public.user_restaurant_mapping 
    WHERE auth_user_id = v_user_id;
    
    -- Si ya existe, retornar el restaurant existente
    IF existing_mapping_count > 0 THEN
        SELECT r.id, r.name, r.email 
        INTO v_restaurant_id, v_restaurant_name, v_restaurant_email
        FROM public.restaurants r
        JOIN public.user_restaurant_mapping urm ON r.id = urm.restaurant_id
        WHERE urm.auth_user_id = v_user_id
        LIMIT 1;
        
        RETURN jsonb_build_object(
            'success', true,
            'restaurant_id', v_restaurant_id,
            'restaurant_name', v_restaurant_name,
            'restaurant_email', v_restaurant_email,
            'message', 'Using existing restaurant'
        );
    END IF;
    
    -- Extraer datos del JSONB
    v_restaurant_name := COALESCE(restaurant_data->>'name', 'Mi Restaurante');
    v_restaurant_email := COALESCE(restaurant_data->>'email', (SELECT email FROM auth.users WHERE id = v_user_id));
    
    -- Crear restaurant
    INSERT INTO public.restaurants (
        name, 
        email, 
        phone, 
        address,
        city, 
        postal_code,
        cuisine_type,
        plan, 
        active,
        created_at
    )
    VALUES (
        v_restaurant_name,
        v_restaurant_email,
        COALESCE(restaurant_data->>'phone', '+34 600 000 000'),
        COALESCE(restaurant_data->>'address', 'Dirección pendiente'),
        COALESCE(restaurant_data->>'city', 'Madrid'),
        COALESCE(restaurant_data->>'postal_code', '28001'),
        COALESCE(restaurant_data->>'cuisine_type', 'mediterranea'),
        COALESCE(restaurant_data->>'plan', 'trial'),
        COALESCE((restaurant_data->>'active')::boolean, true),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_restaurant_id;
    
    -- Crear mapping usuario-restaurant
    INSERT INTO public.user_restaurant_mapping (
        auth_user_id, 
        restaurant_id, 
        role, 
        permissions,
        active,
        created_at
    )
    VALUES (
        v_user_id, 
        v_restaurant_id, 
        'owner', 
        '["all"]'::jsonb,
        true,
        timezone('utc'::text, now())
    );
    
    -- Crear mesas básicas para el restaurant
    INSERT INTO public.tables (restaurant_id, table_number, capacity, zone, status)
    VALUES 
        (v_restaurant_id, 'Mesa 1', 4, 'principal', 'disponible'),
        (v_restaurant_id, 'Mesa 2', 4, 'principal', 'disponible'),
        (v_restaurant_id, 'Mesa 3', 6, 'principal', 'disponible'),
        (v_restaurant_id, 'Mesa 4', 2, 'terraza', 'disponible'),
        (v_restaurant_id, 'Mesa 5', 8, 'privado', 'disponible');
    
    -- Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'restaurant_id', v_restaurant_id,
        'restaurant_name', v_restaurant_name,
        'restaurant_email', v_restaurant_email,
        'message', 'Restaurant created successfully'
    );
    
EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Duplicate restaurant creation prevented'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Error creating restaurant: ' || SQLERRM
        );
END;
$$;

-- Permisos para usuarios autenticados
REVOKE ALL ON FUNCTION public.create_restaurant_securely(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_restaurant_securely(JSONB, JSONB) TO authenticated;

-- Comentario
COMMENT ON FUNCTION public.create_restaurant_securely(JSONB, JSONB) 
IS 'Crea un restaurant de forma segura para el usuario autenticado actual, evitando duplicados';

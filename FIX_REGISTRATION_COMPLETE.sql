-- =====================================================
-- 🔧 SOLUCIÓN COMPLETA PARA EL REGISTRO
-- =====================================================

-- PASO 1: Verificar qué hay actualmente
SELECT 
    id, 
    name, 
    email, 
    phone, 
    address, 
    city, 
    postal_code, 
    cuisine_type,
    country,
    created_at
FROM restaurants 
WHERE email = 'gustausantin@icloud.com'
ORDER BY created_at DESC;

-- PASO 2: Eliminar registros anteriores para empezar limpio
DELETE FROM restaurants WHERE email = 'gustausantin@icloud.com';
DELETE FROM auth.users WHERE email = 'gustausantin@icloud.com';

-- PASO 3: ACTUALIZAR LA FUNCIÓN RPC (CRÍTICO)
DROP FUNCTION IF EXISTS create_restaurant_securely(JSONB, JSONB) CASCADE;

CREATE OR REPLACE FUNCTION create_restaurant_securely(
    restaurant_data JSONB,
    user_profile JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    new_restaurant_id UUID;
    new_restaurant_name TEXT;
    current_user_id UUID;
    result JSONB;
BEGIN
    -- Obtener ID del usuario autenticado
    current_user_id := auth.uid();
    
    -- Validar que hay un usuario autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Validar que el usuario no tiene ya un restaurante
    IF EXISTS (
        SELECT 1 FROM user_restaurant_mapping 
        WHERE auth_user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'User already has a restaurant';
    END IF;
    
    -- Extraer nombre del restaurante
    new_restaurant_name := COALESCE(
        NULLIF(restaurant_data->>'name', ''),
        'Mi Restaurante'
    );
    
    -- Log para debug
    RAISE NOTICE 'Datos recibidos: %', restaurant_data;
    
    -- Crear el restaurante CON LOS DATOS REALES (sin valores por defecto hardcodeados)
    INSERT INTO restaurants (
        name,
        email,
        phone,
        address,
        city,
        country,
        postal_code,
        cuisine_type,
        plan,
        active
    ) VALUES (
        new_restaurant_name,
        COALESCE(restaurant_data->>'email', user_profile->>'email', ''),
        NULLIF(restaurant_data->>'phone', ''),  -- Si está vacío, guardar NULL
        NULLIF(restaurant_data->>'address', ''),  -- Si está vacío, guardar NULL
        NULLIF(restaurant_data->>'city', ''),  -- Si está vacío, guardar NULL
        COALESCE(NULLIF(restaurant_data->>'country', ''), 'España'),  -- Default solo si está vacío
        NULLIF(restaurant_data->>'postal_code', ''),  -- Si está vacío, guardar NULL
        NULLIF(restaurant_data->>'cuisine_type', ''),  -- Si está vacío, guardar NULL
        COALESCE(restaurant_data->>'plan', 'trial'),
        COALESCE((restaurant_data->>'active')::BOOLEAN, true)
    )
    RETURNING id, name INTO new_restaurant_id, new_restaurant_name;
    
    -- Crear el mapping usuario-restaurante
    INSERT INTO user_restaurant_mapping (
        auth_user_id,
        restaurant_id,
        role
    ) VALUES (
        current_user_id,
        new_restaurant_id,
        'owner'
    );
    
    -- Preparar resultado
    result := jsonb_build_object(
        'success', true,
        'restaurant_id', new_restaurant_id,
        'restaurant_name', new_restaurant_name,
        'message', 'Restaurant created successfully'
    );
    
    RAISE NOTICE 'Restaurant creado: % (ID: %)', new_restaurant_name, new_restaurant_id;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creando restaurante: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to create restaurant'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos
GRANT EXECUTE ON FUNCTION create_restaurant_securely(JSONB, JSONB) TO authenticated;

-- PASO 4: Verificar que la función se actualizó correctamente
SELECT 
    routine_name,
    substring(routine_definition from 1 for 200) as definition_preview
FROM information_schema.routines 
WHERE routine_name = 'create_restaurant_securely'
AND routine_schema = 'public';

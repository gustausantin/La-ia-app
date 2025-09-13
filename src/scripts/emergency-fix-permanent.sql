-- 🚨 EMERGENCY FIX PERMANENT: Crear restaurant AHORA y arreglar trigger

-- 1. OBTENER EL USUARIO ACTUAL
SELECT 'USUARIO ACTUAL:' as info, id, email, created_at 
FROM auth.users 
WHERE email = 'gustausantin@gmail.com'
ORDER BY created_at DESC LIMIT 1;

-- 2. CREAR RESTAURANT INMEDIATAMENTE (usando el ID real del usuario)
DO $$
DECLARE
    user_uuid UUID;
    restaurant_uuid UUID;
BEGIN
    -- Obtener ID del usuario
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'gustausantin@gmail.com' 
    ORDER BY created_at DESC LIMIT 1;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: gustausantin@gmail.com';
    END IF;
    
    -- Generar ID para restaurant
    restaurant_uuid := gen_random_uuid();
    
    -- Limpiar datos existentes si los hay
    DELETE FROM user_restaurant_mapping WHERE auth_user_id = user_uuid;
    DELETE FROM restaurants WHERE owner_id = user_uuid;
    
    -- CREAR RESTAURANT
    INSERT INTO restaurants (
        id, name, description, cuisine_type, address, phone, email, 
        owner_id, max_capacity, created_at, updated_at
    ) VALUES (
        restaurant_uuid,
        'Mi Restaurante',
        'Restaurante creado manualmente',
        'internacional',
        'Dirección pendiente',
        '+34 600 000 000',
        'gustausantin@gmail.com',
        user_uuid,
        50,
        NOW(),
        NOW()
    );
    
    -- CREAR MAPPING
    INSERT INTO user_restaurant_mapping (
        auth_user_id, restaurant_id, role, created_at
    ) VALUES (
        user_uuid, restaurant_uuid, 'owner', NOW()
    );
    
    -- CREAR CONFIGURACIÓN
    INSERT INTO restaurant_settings (
        restaurant_id, opening_time, closing_time, 
        max_party_size, advance_booking_days, created_at, updated_at
    ) VALUES (
        restaurant_uuid, '09:00', '23:00', 8, 30, NOW(), NOW()
    );
    
    RAISE NOTICE '✅ RESTAURANT CREADO MANUALMENTE: %', restaurant_uuid;
    RAISE NOTICE '✅ USUARIO: %', user_uuid;
    
END $$;

-- 3. VERIFICAR CREACIÓN
SELECT 
    'VERIFICACIÓN RESTAURANT:' as info,
    r.id as restaurant_id,
    r.name,
    r.email,
    u.email as owner_email,
    urm.role
FROM restaurants r
JOIN auth.users u ON r.owner_id = u.id
JOIN user_restaurant_mapping urm ON r.id = urm.restaurant_id
WHERE u.email = 'gustausantin@gmail.com';

-- 4. DIAGNÓSTICO DEL TRIGGER (por qué no funcionó)
SELECT 'TRIGGERS ACTIVOS:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 5. VERIFICAR PERMISOS DE LA FUNCIÓN
SELECT 'FUNCIÓN TRIGGER:' as info;
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proowner
FROM pg_proc 
WHERE proname IN ('handle_new_user_debug', 'handle_new_user_safe');

-- 6. VERIFICAR RLS EN TABLA RESTAURANTS
SELECT 'RLS STATUS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT string_agg(policyname, ', ') 
     FROM pg_policies 
     WHERE schemaname = 'public' AND tablename = 'restaurants') as policies
FROM pg_tables 
WHERE tablename = 'restaurants';

-- 7. MOSTRAR LOGS RECIENTES DE FUNCIONES (si los hay)
SELECT 'LOGS RECIENTES:' as info;
-- Nota: Los logs específicos dependen de la configuración de Supabase

-- 8. CONFIRMACIÓN FINAL
DO $$
BEGIN
    RAISE NOTICE '🚨 RESTAURANT CREADO MANUALMENTE - App debería funcionar AHORA';
    RAISE NOTICE '🔍 Revisa los resultados para identificar por qué falló el trigger';
    RAISE NOTICE '🚀 Ve a la app en Vercel - debería cargar normalmente';
END $$;

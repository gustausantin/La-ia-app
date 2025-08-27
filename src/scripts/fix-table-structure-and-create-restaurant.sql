-- 🚨 FIX FINAL: Arreglar tabla restaurants y crear restaurant

-- 1. VER COLUMNAS ACTUALES
SELECT 'COLUMNAS ACTUALES:' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND table_schema = 'public';

-- 2. AÑADIR COLUMNAS FALTANTES (si no existen)
DO $$
BEGIN
    -- Añadir owner_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Columna owner_id añadida';
    END IF;
    
    -- Añadir name si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'name'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Columna name añadida';
    END IF;
    
    -- Añadir email si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'email'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Columna email añadida';
    END IF;
    
    -- Añadir created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Columna created_at añadida';
    END IF;
    
    -- Añadir updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at añadida';
    END IF;
    
END $$;

-- 3. CREAR RESTAURANT PARA EL USUARIO ACTUAL
DO $$
DECLARE
    user_uuid UUID;
    restaurant_uuid UUID;
BEGIN
    -- Obtener usuario
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'gustausantin@gmail.com' 
    ORDER BY created_at DESC LIMIT 1;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;
    
    -- Generar restaurant ID
    restaurant_uuid := gen_random_uuid();
    
    -- Limpiar existente
    DELETE FROM user_restaurant_mapping WHERE auth_user_id = user_uuid;
    DELETE FROM restaurants WHERE owner_id = user_uuid;
    
    -- Crear restaurant
    INSERT INTO restaurants (
        id, name, email, owner_id, created_at, updated_at
    ) VALUES (
        restaurant_uuid,
        'Mi Restaurante',
        'gustausantin@gmail.com',
        user_uuid,
        NOW(),
        NOW()
    );
    
    -- Crear mapping
    INSERT INTO user_restaurant_mapping (
        auth_user_id, restaurant_id, role, created_at
    ) VALUES (
        user_uuid, restaurant_uuid, 'owner', NOW()
    );
    
    RAISE NOTICE '✅ RESTAURANT CREADO: %', restaurant_uuid;
    RAISE NOTICE '✅ USUARIO: %', user_uuid;
    
END $$;

-- 4. VERIFICAR CREACIÓN
SELECT 
    'VERIFICACIÓN:' as info,
    r.id as restaurant_id,
    r.name,
    r.email,
    u.email as owner_email
FROM restaurants r
JOIN auth.users u ON r.owner_id = u.id
WHERE u.email = 'gustausantin@gmail.com';

-- 5. MOSTRAR ESTRUCTURA FINAL
SELECT 'ESTRUCTURA FINAL:' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 🔧 SCRIPT PARA ARREGLAR USUARIOS EXISTENTES SIN RESTAURANT
-- Ejecutar en Supabase SQL Editor

-- =========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- =========================================
SELECT 'DIAGNÓSTICO DE USUARIOS SIN RESTAURANT' as info;

-- Usuarios confirmados sin restaurant
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    CASE WHEN p.auth_user_id IS NULL THEN '❌ Sin perfil' ELSE '✅ Con perfil' END as perfil_status,
    CASE WHEN m.auth_user_id IS NULL THEN '❌ Sin restaurant' ELSE '✅ Con restaurant' END as restaurant_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.auth_user_id
LEFT JOIN user_restaurant_mapping m ON u.id = m.auth_user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC;

-- =========================================
-- PASO 2: CREAR RESTAURANT PARA USUARIO ESPECÍFICO
-- =========================================

-- CAMBIAR ESTE USER_ID POR EL TUYO:
DO $$ 
DECLARE
    target_user_id UUID := 'd0bc9b56-9a0b-44e1-bb96-b21fa13e34c8'; -- 👈 CAMBIAR AQUÍ
    user_email TEXT;
    restaurant_id_val UUID;
BEGIN
    -- Obtener email del usuario
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id AND email_confirmed_at IS NOT NULL;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado o no confirmado: %', target_user_id;
    END IF;
    
    RAISE NOTICE 'Creando restaurant para usuario: %', user_email;
    
    -- Crear restaurant
    INSERT INTO restaurants (name, email, phone, city, plan, active)
    VALUES (
        'Mi Restaurante (' || user_email || ')', -- nombre basado en email
        user_email,
        '+34 600 000 000',
        'Madrid',
        'trial',
        true
    )
    RETURNING id INTO restaurant_id_val;
    
    RAISE NOTICE '✅ Restaurant creado con ID: %', restaurant_id_val;
    
    -- Crear/actualizar perfil
    INSERT INTO profiles (auth_user_id, email, full_name)
    VALUES (target_user_id, user_email, 'Mi Restaurante (' || user_email || ')')
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Perfil creado/actualizado';
    
    -- Crear mapping
    INSERT INTO user_restaurant_mapping (auth_user_id, restaurant_id)
    VALUES (target_user_id, restaurant_id_val)
    ON CONFLICT (auth_user_id) DO UPDATE SET
        restaurant_id = EXCLUDED.restaurant_id,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Mapping creado/actualizado';
    RAISE NOTICE '🎉 USUARIO CONFIGURADO CORRECTAMENTE - RECARGA LA PÁGINA';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE;
END $$;

-- =========================================
-- PASO 3: VERIFICAR RESULTADO
-- =========================================
SELECT 'VERIFICACIÓN POST-CREACIÓN' as info;

SELECT 
    'Usuario: ' || u.email as info,
    'Restaurant: ' || r.name as restaurant,
    'Mapping: ' || CASE WHEN m.auth_user_id IS NOT NULL THEN '✅ OK' ELSE '❌ FALTA' END as mapping_status
FROM auth.users u
LEFT JOIN user_restaurant_mapping m ON u.id = m.auth_user_id  
LEFT JOIN restaurants r ON m.restaurant_id = r.id
WHERE u.id = 'd0bc9b56-9a0b-44e1-bb96-b21fa13e34c8'; -- 👈 CAMBIAR AQUÍ TAMBIÉN

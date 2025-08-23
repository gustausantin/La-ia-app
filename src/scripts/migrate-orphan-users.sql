-- 🏗️ MIGRACIÓN ENTERPRISE: Crear restaurants para usuarios huérfanos
-- EJECUTAR UNA SOLA VEZ en Supabase SQL Editor para arreglar usuarios existentes

-- =========================================
-- FUNCIÓN DE MIGRACIÓN AUTOMÁTICA
-- =========================================

CREATE OR REPLACE FUNCTION migrate_orphan_users()
RETURNS TABLE(
    user_id UUID,
    user_email TEXT,
    restaurant_id UUID,
    status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphan_user RECORD;
    new_restaurant_id UUID;
    migration_count INTEGER := 0;
BEGIN
    -- Log inicio de migración
    RAISE NOTICE '🚀 INICIANDO MIGRACIÓN DE USUARIOS HUÉRFANOS...';
    
    -- Buscar usuarios confirmados sin restaurant
    FOR orphan_user IN 
        SELECT 
            u.id,
            u.email,
            u.email_confirmed_at,
            u.created_at
        FROM auth.users u
        LEFT JOIN user_restaurant_mapping m ON u.id = m.auth_user_id
        WHERE u.email_confirmed_at IS NOT NULL 
        AND m.auth_user_id IS NULL
        ORDER BY u.created_at ASC
    LOOP
        BEGIN
            RAISE NOTICE 'Migrando usuario: % (ID: %)', orphan_user.email, orphan_user.id;
            
            -- Crear restaurant para el usuario huérfano
            INSERT INTO restaurants (name, email, phone, city, plan, active, created_at)
            VALUES (
                'Restaurante de ' || split_part(orphan_user.email, '@', 1),
                orphan_user.email,
                '+34 600 000 000',
                'Madrid',
                'trial',
                true,
                NOW()
            )
            RETURNING id INTO new_restaurant_id;
            
            -- Crear/actualizar perfil
            INSERT INTO profiles (auth_user_id, email, full_name, created_at, updated_at)
            VALUES (
                orphan_user.id,
                orphan_user.email,
                split_part(orphan_user.email, '@', 1),
                NOW(),
                NOW()
            )
            ON CONFLICT (auth_user_id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                updated_at = NOW();
            
            -- Crear mapping
            INSERT INTO user_restaurant_mapping (auth_user_id, restaurant_id, created_at, updated_at)
            VALUES (
                orphan_user.id,
                new_restaurant_id,
                NOW(),
                NOW()
            );
            
            -- Retornar resultado exitoso
            user_id := orphan_user.id;
            user_email := orphan_user.email;
            restaurant_id := new_restaurant_id;
            status := '✅ MIGRADO';
            
            migration_count := migration_count + 1;
            
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- En caso de error, continuar con el siguiente usuario
                RAISE WARNING 'Error migrando usuario %: %', orphan_user.email, SQLERRM;
                
                user_id := orphan_user.id;
                user_email := orphan_user.email;
                restaurant_id := NULL;
                status := '❌ ERROR: ' || SQLERRM;
                
                RETURN NEXT;
        END;
    END LOOP;
    
    RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA: % usuarios procesados', migration_count;
    
END;
$$;

-- =========================================
-- EJECUTAR MIGRACIÓN
-- =========================================

-- Ejecutar la migración y mostrar resultados
SELECT 
    user_email as "Usuario",
    user_id as "ID Usuario",
    restaurant_id as "ID Restaurant",
    status as "Estado"
FROM migrate_orphan_users()
ORDER BY status, user_email;

-- =========================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =========================================

-- Verificar que todos los usuarios confirmados tienen restaurant
SELECT 
    'RESUMEN DE MIGRACIÓN' as info,
    COUNT(*) as total_usuarios_confirmados,
    COUNT(m.auth_user_id) as usuarios_con_restaurant,
    COUNT(*) - COUNT(m.auth_user_id) as usuarios_sin_restaurant
FROM auth.users u
LEFT JOIN user_restaurant_mapping m ON u.id = m.auth_user_id
WHERE u.email_confirmed_at IS NOT NULL;

-- Listar usuarios que aún no tienen restaurant (deberían ser 0)
SELECT 
    u.email as "Usuario sin restaurant",
    u.created_at as "Fecha registro"
FROM auth.users u
LEFT JOIN user_restaurant_mapping m ON u.id = m.auth_user_id
WHERE u.email_confirmed_at IS NOT NULL 
AND m.auth_user_id IS NULL;

-- =========================================
-- LIMPIAR FUNCIÓN (opcional)
-- =========================================
-- DROP FUNCTION IF EXISTS migrate_orphan_users();

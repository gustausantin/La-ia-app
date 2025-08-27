-- 🗑️ SCRIPT DE LIMPIEZA COMPLETA DE USUARIO
-- ⚠️ USAR CON PRECAUCIÓN - ELIMINA TODOS LOS DATOS DEL USUARIO

-- Función para limpiar completamente un usuario
CREATE OR REPLACE FUNCTION cleanup_user_data(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
    restaurant_uuid UUID;
    cleanup_result TEXT := '';
    table_name TEXT;
    row_count INTEGER;
BEGIN
    -- 1. Buscar el usuario por email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RETURN '❌ Usuario con email ' || user_email || ' no encontrado';
    END IF;
    
    cleanup_result := '🔍 USUARIO ENCONTRADO: ' || user_uuid::text || E'\n';
    
    -- 2. Buscar el restaurant_id asociado
    SELECT restaurant_id INTO restaurant_uuid 
    FROM user_restaurant_mapping 
    WHERE auth_user_id = user_uuid;
    
    IF restaurant_uuid IS NULL THEN
        cleanup_result := cleanup_result || '⚠️ No se encontró restaurant asociado' || E'\n';
    ELSE
        cleanup_result := cleanup_result || '🏢 RESTAURANT ENCONTRADO: ' || restaurant_uuid::text || E'\n';
    END IF;
    
    -- 3. LIMPIEZA EN ORDEN (de dependientes a principales)
    
    -- 3.1 Notifications
    DELETE FROM notifications WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '🔔 Notifications eliminadas: ' || row_count || E'\n';
    
    -- 3.2 Messages
    DELETE FROM messages WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '💬 Messages eliminados: ' || row_count || E'\n';
    
    -- 3.3 Conversations
    DELETE FROM conversations WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '🗨️ Conversations eliminadas: ' || row_count || E'\n';
    
    -- 3.4 Message Templates
    DELETE FROM message_templates WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📝 Message Templates eliminadas: ' || row_count || E'\n';
    
    -- 3.5 Analytics
    DELETE FROM analytics WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📊 Analytics eliminados: ' || row_count || E'\n';
    
    -- 3.6 Analytics Historical
    DELETE FROM analytics_historical WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📈 Analytics Historical eliminados: ' || row_count || E'\n';
    
    -- 3.7 Daily Metrics
    DELETE FROM daily_metrics WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📅 Daily Metrics eliminados: ' || row_count || E'\n';
    
    -- 3.8 Inventory Items
    DELETE FROM inventory_items WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📦 Inventory Items eliminados: ' || row_count || E'\n';
    
    -- 3.9 Inventory
    DELETE FROM inventory WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📋 Inventory eliminado: ' || row_count || E'\n';
    
    -- 3.10 Staff
    DELETE FROM staff WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '👨‍💼 Staff eliminado: ' || row_count || E'\n';
    
    -- 3.11 Restaurant Settings
    DELETE FROM restaurant_settings WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '⚙️ Restaurant Settings eliminados: ' || row_count || E'\n';
    
    -- 3.12 Reservations
    DELETE FROM reservations WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '📅 Reservations eliminadas: ' || row_count || E'\n';
    
    -- 3.13 Customers
    DELETE FROM customers WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '👤 Customers eliminados: ' || row_count || E'\n';
    
    -- 3.14 Tables
    DELETE FROM tables WHERE restaurant_id = restaurant_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '🪑 Tables eliminadas: ' || row_count || E'\n';
    
    -- 3.15 User Restaurant Mapping
    DELETE FROM user_restaurant_mapping WHERE auth_user_id = user_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '🔗 User Restaurant Mapping eliminado: ' || row_count || E'\n';
    
    -- 3.16 Profiles
    DELETE FROM profiles WHERE auth_user_id = user_uuid;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    cleanup_result := cleanup_result || '👤 Profiles eliminados: ' || row_count || E'\n';
    
    -- 3.17 Restaurant (última tabla)
    IF restaurant_uuid IS NOT NULL THEN
        DELETE FROM restaurants WHERE id = restaurant_uuid;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🏢 Restaurant eliminado: ' || row_count || E'\n';
    END IF;
    
    -- 3.18 Auth User (OPCIONAL - descomenta si quieres eliminar completamente)
    -- ⚠️ PELIGRO: Esto elimina el usuario de autenticación
    -- DELETE FROM auth.users WHERE id = user_uuid;
    -- GET DIAGNOSTICS row_count = ROW_COUNT;
    -- cleanup_result := cleanup_result || '🔑 Auth User eliminado: ' || row_count || E'\n';
    
    cleanup_result := cleanup_result || E'\n✅ LIMPIEZA COMPLETA EXITOSA' || E'\n';
    cleanup_result := cleanup_result || '🎯 Usuario puede registrarse nuevamente sin problemas';
    
    RETURN cleanup_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN '❌ ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para restaurar solo el mapping sin crear nuevo restaurant
CREATE OR REPLACE FUNCTION restore_user_mapping(user_email TEXT, target_restaurant_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
    result_text TEXT := '';
BEGIN
    -- Buscar el usuario
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RETURN '❌ Usuario no encontrado: ' || user_email;
    END IF;
    
    -- Verificar que el restaurant existe
    IF NOT EXISTS(SELECT 1 FROM restaurants WHERE id = target_restaurant_id) THEN
        RETURN '❌ Restaurant no encontrado: ' || target_restaurant_id::text;
    END IF;
    
    -- Insertar mapping
    INSERT INTO user_restaurant_mapping (
        auth_user_id,
        restaurant_id,
        role,
        permissions,
        active,
        created_at
    ) VALUES (
        user_uuid,
        target_restaurant_id,
        'owner',
        '{"all": true}',
        true,
        NOW()
    );
    
    result_text := '✅ MAPPING RESTAURADO' || E'\n';
    result_text := result_text || '👤 Usuario: ' || user_uuid::text || E'\n';
    result_text := result_text || '🏢 Restaurant: ' || target_restaurant_id::text || E'\n';
    result_text := result_text || '🎯 La aplicación debería funcionar normalmente';
    
    RETURN result_text;
    
EXCEPTION WHEN OTHERS THEN
    RETURN '❌ ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EJEMPLOS DE USO:

-- 1. Para limpiar completamente un usuario:
-- SELECT cleanup_user_data('email@ejemplo.com');

-- 2. Para restaurar solo el mapping (si tienes el restaurant_id):
-- SELECT restore_user_mapping('email@ejemplo.com', 'uuid-del-restaurant');

-- 3. Para verificar estado actual:
-- SELECT 
--     u.id as user_id,
--     u.email,
--     urm.restaurant_id,
--     r.name as restaurant_name
-- FROM auth.users u
-- LEFT JOIN user_restaurant_mapping urm ON u.id = urm.auth_user_id
-- LEFT JOIN restaurants r ON urm.restaurant_id = r.id
-- WHERE u.email = 'email@ejemplo.com';

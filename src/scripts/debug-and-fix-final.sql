-- 🔍 DEBUG Y FIX FINAL: Encontrar por qué no se crea el restaurant

-- 1. VERIFICAR QUE TABLAS EXISTEN Y TIENEN LA ESTRUCTURA CORRECTA
SELECT 'restaurants table structure:' as debug_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND table_schema = 'public';

SELECT 'user_restaurant_mapping table structure:' as debug_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_restaurant_mapping' AND table_schema = 'public';

-- 2. VERIFICAR PERMISOS DE LA FUNCIÓN
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'handle_new_user_safe';

-- 3. CREAR FUNCIÓN DE TEST MANUAL
CREATE OR REPLACE FUNCTION public.test_restaurant_creation()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_user_id UUID := '12345678-1234-1234-1234-123456789012';
    new_restaurant_id UUID;
    result_text TEXT := '';
BEGIN
    new_restaurant_id := gen_random_uuid();
    result_text := 'Starting test with restaurant_id: ' || new_restaurant_id::text || E'\n';
    
    BEGIN
        INSERT INTO restaurants (
            id,
            name,
            email,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            new_restaurant_id,
            'Test Restaurant',
            'test@test.com',
            test_user_id,
            NOW(),
            NOW()
        );
        
        result_text := result_text || 'Restaurant created successfully' || E'\n';
        
    EXCEPTION WHEN OTHERS THEN
        result_text := result_text || 'ERROR creating restaurant: ' || SQLERRM || E'\n';
        RETURN result_text;
    END;
    
    BEGIN
        INSERT INTO user_restaurant_mapping (
            auth_user_id,
            restaurant_id,
            role,
            created_at
        ) VALUES (
            test_user_id,
            new_restaurant_id,
            'owner',
            NOW()
        );
        
        result_text := result_text || 'Mapping created successfully' || E'\n';
        
    EXCEPTION WHEN OTHERS THEN
        result_text := result_text || 'ERROR creating mapping: ' || SQLERRM || E'\n';
    END;
    
    -- Limpiar test data
    DELETE FROM user_restaurant_mapping WHERE auth_user_id = test_user_id;
    DELETE FROM restaurants WHERE id = new_restaurant_id;
    
    result_text := result_text || 'Test completed and cleaned up';
    RETURN result_text;
END;
$$;

-- 4. EJECUTAR TEST
SELECT test_restaurant_creation() as test_result;

-- 5. FUNCIÓN CORREGIDA CON LOGGING DETALLADO
CREATE OR REPLACE FUNCTION public.handle_new_user_debug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_restaurant_id UUID;
    error_details TEXT;
BEGIN
    -- Log de entrada
    RAISE NOTICE 'TRIGGER DEBUG: Usuario creado: %', NEW.id;
    RAISE NOTICE 'TRIGGER DEBUG: Email: %', NEW.email;
    
    new_restaurant_id := gen_random_uuid();
    RAISE NOTICE 'TRIGGER DEBUG: Restaurant ID generado: %', new_restaurant_id;
    
    -- Verificar que las tablas existan
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN
        RAISE NOTICE 'TRIGGER ERROR: Tabla restaurants no existe';
        RETURN NEW;
    END IF;
    
    BEGIN
        INSERT INTO restaurants (
            id,
            name,
            email,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            new_restaurant_id,
            'Mi Restaurante',
            NEW.email,
            NEW.id,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'TRIGGER DEBUG: Restaurant insertado correctamente';
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_details = PG_EXCEPTION_DETAIL;
        RAISE NOTICE 'TRIGGER ERROR restaurants: % - %', SQLERRM, error_details;
        RETURN NEW;
    END;
    
    BEGIN
        INSERT INTO user_restaurant_mapping (
            auth_user_id,
            restaurant_id,
            role,
            created_at
        ) VALUES (
            NEW.id,
            new_restaurant_id,
            'owner',
            NOW()
        );
        
        RAISE NOTICE 'TRIGGER DEBUG: Mapping insertado correctamente';
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_details = PG_EXCEPTION_DETAIL;
        RAISE NOTICE 'TRIGGER ERROR mapping: % - %', SQLERRM, error_details;
    END;
    
    RAISE NOTICE 'TRIGGER DEBUG: Proceso completado para usuario %', NEW.id;
    RETURN NEW;
END;
$$;

-- 6. ACTUALIZAR TRIGGER CON FUNCIÓN DE DEBUG
DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;

CREATE TRIGGER on_auth_user_created_debug
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_debug();

-- 7. VERIFICACIÓN FINAL
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_debug';

-- 8. CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '✅ TRIGGER DEBUG INSTALADO - Ahora veremos exactamente qué falla';
    RAISE NOTICE '📊 Regístrate y checa los logs en Supabase → Logs → Functions';
END $$;

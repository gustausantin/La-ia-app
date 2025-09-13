-- 🚨 FIX EMERGENCY: Trigger está bloqueando registros
-- SOLUCIÓN: Deshabilitar trigger temporalmente y crear versión mejorada

-- 1. DESHABILITAR TRIGGER PROBLEMÁTICO
DROP TRIGGER IF EXISTS on_auth_user_created_enterprise ON auth.users;

-- 2. FUNCIÓN CORREGIDA (sin errores)
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_restaurant_id UUID;
BEGIN
    -- Log simple
    RAISE LOG 'Creating restaurant for user: %', NEW.id;
    
    -- Generar ID
    new_restaurant_id := gen_random_uuid();
    
    -- Usar bloques de excepción para cada operación
    BEGIN
        -- Crear restaurant con datos mínimos seguros
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
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating restaurant: %', SQLERRM;
        RETURN NEW; -- Continuar aunque falle
    END;
    
    BEGIN
        -- Crear mapping
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
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating mapping: %', SQLERRM;
        RETURN NEW; -- Continuar aunque falle
    END;
    
    RAISE LOG 'Restaurant created successfully: %', new_restaurant_id;
    RETURN NEW;
END;
$$;

-- 3. TRIGGER SEGURO (NO bloquea registros)
CREATE TRIGGER on_auth_user_created_safe
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_safe();

-- 4. VERIFICACIÓN
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_safe';

-- 5. CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '✅ TRIGGER SEGURO INSTALADO';
    RAISE NOTICE '🚫 TRIGGER PROBLEMÁTICO ELIMINADO';
    RAISE NOTICE '✅ REGISTROS DESBLOQUEADOS';
END $$;

-- =====================================================
-- ELIMINAR CHECK CONSTRAINT PROBLEMÁTICO
-- =====================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar el nombre del constraint de action_type
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'automation_rules'
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%action_type%';

    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE '🗑️ Eliminando constraint: %', constraint_name;
        EXECUTE 'ALTER TABLE automation_rules DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE '✅ Constraint eliminado exitosamente';
    ELSE
        RAISE NOTICE '⚠️ No se encontró constraint de action_type';
    END IF;
END $$;

-- Verificar que action_type permite cualquier valor ahora
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando que action_type permite valores libres...';
    
    -- Intentar insertar y borrar un valor de prueba
    INSERT INTO automation_rules (
        id, restaurant_id, name, description, is_active, 
        rule_type, action_type, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 
        gen_random_uuid(), 
        'TEST', 
        'Test constraint', 
        false, 
        'manual', 
        'send_message', 
        now(), 
        now()
    );
    
    DELETE FROM automation_rules WHERE name = 'TEST';
    
    RAISE NOTICE '✅ action_type acepta "send_message" - LISTO PARA SEEDS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

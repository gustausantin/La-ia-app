-- =====================================================
-- ELIMINAR DEFAULTS PROBLEMÁTICOS Y CONSTRAINTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ Eliminando defaults y constraints problemáticos...';
    
    -- 1. Cambiar defaults de rule_type y action_type a NULL
    BEGIN
        ALTER TABLE automation_rules ALTER COLUMN rule_type DROP DEFAULT;
        RAISE NOTICE '✅ Default de rule_type eliminado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ rule_type: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE automation_rules ALTER COLUMN action_type DROP DEFAULT;
        RAISE NOTICE '✅ Default de action_type eliminado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ action_type: %', SQLERRM;
    END;
    
    -- 2. Hacer las columnas NULL si no lo son
    BEGIN
        ALTER TABLE automation_rules ALTER COLUMN rule_type DROP NOT NULL;
        RAISE NOTICE '✅ rule_type puede ser NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ rule_type NULL: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE automation_rules ALTER COLUMN action_type DROP NOT NULL;
        RAISE NOTICE '✅ action_type puede ser NULL';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ action_type NULL: %', SQLERRM;
    END;
    
    -- 3. Eliminar constraints de CHECK
    DECLARE
        constraint_record RECORD;
    BEGIN
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'automation_rules' 
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%rule_type%'
        LOOP
            EXECUTE 'ALTER TABLE automation_rules DROP CONSTRAINT ' || constraint_record.constraint_name;
            RAISE NOTICE '✅ Constraint eliminado: %', constraint_record.constraint_name;
        END LOOP;
        
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'automation_rules' 
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%action_type%'
        LOOP
            EXECUTE 'ALTER TABLE automation_rules DROP CONSTRAINT ' || constraint_record.constraint_name;
            RAISE NOTICE '✅ Constraint eliminado: %', constraint_record.constraint_name;
        END LOOP;
    END;
    
    RAISE NOTICE '🎯 LISTO - Ahora automation_rules acepta rule_type y action_type NULL';
END $$;

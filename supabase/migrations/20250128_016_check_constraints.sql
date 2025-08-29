-- =====================================================
-- VERIFICAR QUÉ VALORES PERMITE action_type
-- =====================================================

-- Ver constraint de action_type
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname LIKE '%action_type_check%' 
    AND conrelid = 'automation_rules'::regclass;
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE '🔍 CHECK constraint de action_type: %', constraint_def;
    ELSE
        RAISE NOTICE '❌ No se encontró constraint de action_type';
    END IF;
END $$;

-- Ver TODAS las constraints de automation_rules
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '📋 TODAS LAS CONSTRAINTS DE automation_rules:';
    
    FOR constraint_record IN 
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'automation_rules'::regclass
    LOOP
        RAISE NOTICE '  - %: %', constraint_record.conname, constraint_record.definition;
    END LOOP;
END $$;

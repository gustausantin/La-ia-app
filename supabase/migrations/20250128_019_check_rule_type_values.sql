-- =====================================================
-- VER QUÉ VALORES PERMITE rule_type
-- =====================================================

DO $$
DECLARE
    constraint_info RECORD;
    check_clause TEXT;
BEGIN
    RAISE NOTICE '🔍 BUSCANDO CONSTRAINT DE rule_type...';
    
    -- Buscar el constraint de rule_type
    SELECT tc.constraint_name, cc.check_clause
    INTO constraint_info
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'automation_rules'
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%rule_type%';

    IF FOUND THEN
        RAISE NOTICE '✅ Constraint encontrado: %', constraint_info.constraint_name;
        RAISE NOTICE '📋 Valores permitidos: %', constraint_info.check_clause;
        
        -- Extraer valores del constraint (formato típico: rule_type IN ('val1', 'val2'))
        IF constraint_info.check_clause LIKE '%IN (%' THEN
            RAISE NOTICE '💡 VALORES VÁLIDOS PARA rule_type:';
            RAISE NOTICE '   %', constraint_info.check_clause;
        END IF;
    ELSE
        RAISE NOTICE '❌ No se encontró constraint de rule_type';
    END IF;
END $$;

-- También ver constraint de action_type por si acaso
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO action_type también...';
    
    SELECT tc.constraint_name, cc.check_clause
    INTO constraint_info
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'automation_rules'
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%action_type%';

    IF FOUND THEN
        RAISE NOTICE '⚠️ action_type constraint AÚN EXISTE: %', constraint_info.constraint_name;
        RAISE NOTICE '📋 Valores: %', constraint_info.check_clause;
    ELSE
        RAISE NOTICE '✅ action_type constraint eliminado correctamente';
    END IF;
END $$;

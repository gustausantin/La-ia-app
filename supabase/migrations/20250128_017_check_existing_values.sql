-- =====================================================
-- VER VALORES EXISTENTES DE action_type
-- =====================================================

-- Ver qué valores tiene action_type en los datos existentes
DO $$
DECLARE
    value_record RECORD;
BEGIN
    RAISE NOTICE '🔍 VALORES EXISTENTES DE action_type:';
    
    FOR value_record IN 
        SELECT DISTINCT action_type, COUNT(*) as count
        FROM automation_rules 
        WHERE action_type IS NOT NULL
        GROUP BY action_type
    LOOP
        RAISE NOTICE '  - "%": % registros', value_record.action_type, value_record.count;
    END LOOP;
    
    -- Ver si hay registros con action_type NULL
    IF EXISTS (SELECT 1 FROM automation_rules WHERE action_type IS NULL) THEN
        RAISE NOTICE '⚠️ Hay registros con action_type NULL';
    END IF;
END $$;

-- Ver estructura completa de la columna action_type
DO $$
DECLARE
    col_info RECORD;
BEGIN
    SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
    INTO col_info
    FROM information_schema.columns 
    WHERE table_name = 'automation_rules' 
    AND column_name = 'action_type';
    
    IF FOUND THEN
        RAISE NOTICE '📋 INFO DE action_type: tipo=%, nullable=%, default=%, max_length=%', 
            col_info.data_type, 
            col_info.is_nullable, 
            COALESCE(col_info.column_default, 'none'),
            COALESCE(col_info.character_maximum_length::TEXT, 'unlimited');
    ELSE
        RAISE NOTICE '❌ Columna action_type NO EXISTE';
    END IF;
END $$;

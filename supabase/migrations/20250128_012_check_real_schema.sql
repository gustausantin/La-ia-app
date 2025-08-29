-- =====================================================
-- VERIFICAR ESQUEMA REAL DE LAS TABLAS
-- =====================================================

-- 1. MOSTRAR TODAS LAS COLUMNAS DE message_templates
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '📋 COLUMNAS REALES DE message_templates:';
    
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable, 
            COALESCE(col_record.column_default, 'none');
    END LOOP;
END $$;

-- 2. MOSTRAR TODAS LAS COLUMNAS DE automation_rules
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '📋 COLUMNAS REALES DE automation_rules:';
    
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable, 
            COALESCE(col_record.column_default, 'none');
    END LOOP;
END $$;

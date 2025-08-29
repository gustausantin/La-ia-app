-- =====================================================
-- FIX: Agregar rule_type a automation_rules
-- =====================================================

-- Agregar valor por defecto a rule_type si es NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'rule_type'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '🔧 Agregando valor por defecto a rule_type...';
        ALTER TABLE automation_rules ALTER COLUMN rule_type SET DEFAULT 'automatic';
        
        -- Llenar valores NULL existentes
        UPDATE automation_rules SET rule_type = 'automatic' WHERE rule_type IS NULL;
        
        RAISE NOTICE '✅ rule_type configurado con valor por defecto';
    ELSE
        RAISE NOTICE '⚠️ rule_type no existe o ya permite NULL';
    END IF;
END $$;

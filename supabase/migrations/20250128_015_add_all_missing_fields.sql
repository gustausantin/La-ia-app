-- =====================================================
-- FIX DEFINITIVO: Agregar TODOS los campos faltantes
-- =====================================================

-- Agregar action_type y cualquier otro campo que falte
DO $$
BEGIN
    -- action_type
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'action_type'
    ) THEN
        RAISE NOTICE '➕ Agregando action_type...';
        ALTER TABLE automation_rules ADD COLUMN action_type TEXT NOT NULL DEFAULT 'send_message';
    ELSE
        RAISE NOTICE '🔧 Configurando action_type por defecto...';
        ALTER TABLE automation_rules ALTER COLUMN action_type SET DEFAULT 'send_message';
        UPDATE automation_rules SET action_type = 'send_message' WHERE action_type IS NULL;
    END IF;
END $$;

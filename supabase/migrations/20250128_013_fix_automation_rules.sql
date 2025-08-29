-- =====================================================
-- FIX: Agregar columna trigger_event a automation_rules
-- =====================================================

-- Agregar la columna que falta en automation_rules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'trigger_event'
    ) THEN
        RAISE NOTICE '➕ Agregando columna trigger_event a automation_rules...';
        ALTER TABLE automation_rules 
        ADD COLUMN trigger_event TEXT NOT NULL DEFAULT 'manual' 
        CHECK (trigger_event IN ('reservation_completed', 'segment_changed', 'daily_check', 'birthday', 'manual'));
        RAISE NOTICE '✅ Columna trigger_event agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna trigger_event ya existe';
    END IF;
END $$;

-- Agregar otras columnas que puedan faltar
DO $$
BEGIN
    -- target_segment
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'target_segment'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN target_segment TEXT;
        RAISE NOTICE '✅ Columna target_segment agregada';
    END IF;
    
    -- template_id
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN template_id UUID REFERENCES message_templates(id);
        RAISE NOTICE '✅ Columna template_id agregada';
    END IF;
    
    -- cooldown_days
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'cooldown_days'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN cooldown_days INTEGER DEFAULT 30;
        RAISE NOTICE '✅ Columna cooldown_days agregada';
    END IF;
    
    -- max_executions_per_customer
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'max_executions_per_customer'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN max_executions_per_customer INTEGER DEFAULT 5;
        RAISE NOTICE '✅ Columna max_executions_per_customer agregada';
    END IF;
    
    -- max_daily_executions
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'max_daily_executions'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN max_daily_executions INTEGER DEFAULT 50;
        RAISE NOTICE '✅ Columna max_daily_executions agregada';
    END IF;
    
    -- execution_hours_start
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'execution_hours_start'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN execution_hours_start TIME DEFAULT '09:00';
        RAISE NOTICE '✅ Columna execution_hours_start agregada';
    END IF;
    
    -- execution_hours_end
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'execution_hours_end'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN execution_hours_end TIME DEFAULT '21:00';
        RAISE NOTICE '✅ Columna execution_hours_end agregada';
    END IF;
    
    -- execution_days_of_week
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'execution_days_of_week'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN execution_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7];
        RAISE NOTICE '✅ Columna execution_days_of_week agregada';
    END IF;
    
    -- action_config
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'automation_rules' 
        AND column_name = 'action_config'
    ) THEN
        ALTER TABLE automation_rules ADD COLUMN action_config JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Columna action_config agregada';
    END IF;
END $$;

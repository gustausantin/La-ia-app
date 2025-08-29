-- =====================================================
-- FIX RÁPIDO: Agregar constraints faltantes
-- Migración: 20250128_009_fix_constraints.sql
-- =====================================================

-- 1. AGREGAR CONSTRAINT ÚNICA A message_templates (con verificación)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'message_templates' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'message_templates_restaurant_name_unique'
    ) THEN
        ALTER TABLE message_templates 
        ADD CONSTRAINT message_templates_restaurant_name_unique 
        UNIQUE (restaurant_id, name);
        RAISE NOTICE '✅ Constraint message_templates_restaurant_name_unique agregada';
    ELSE
        RAISE NOTICE '⚠️ Constraint message_templates_restaurant_name_unique ya existe';
    END IF;
END $$;

-- 2. AGREGAR CONSTRAINT ÚNICA A automation_rules (con verificación)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'automation_rules' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'automation_rules_restaurant_name_unique'
    ) THEN
        ALTER TABLE automation_rules 
        ADD CONSTRAINT automation_rules_restaurant_name_unique 
        UNIQUE (restaurant_id, name);
        RAISE NOTICE '✅ Constraint automation_rules_restaurant_name_unique agregada';
    ELSE
        RAISE NOTICE '⚠️ Constraint automation_rules_restaurant_name_unique ya existe';
    END IF;
END $$;

-- 3. VERIFICAR QUE SE CREARON
DO $$
BEGIN
    IF EXISTS (
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'message_templates' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'message_templates_restaurant_name_unique'
    ) THEN
        RAISE NOTICE '✅ Constraint message_templates_restaurant_name_unique creada correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Constraint no se pudo crear';
    END IF;
END $$;

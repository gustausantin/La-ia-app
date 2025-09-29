-- =====================================================
-- FIX SIMPLE: VERIFICAR Y AÑADIR CONSTRAINT
-- =====================================================

-- Verificar constraint existente
SELECT 
    'CONSTRAINT_ACTUAL' as info,
    conname as nombre_constraint,
    pg_get_constraintdef(oid) as definicion
FROM pg_constraint 
WHERE conrelid = 'availability_slots'::regclass
AND contype = 'u';

-- Si no existe, añadirlo (sintaxis correcta)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'availability_slots'::regclass
        AND conname = 'availability_slots_restaurant_id_table_id_slot_date_start_time_key'
    ) THEN
        ALTER TABLE availability_slots 
        ADD CONSTRAINT availability_slots_unique_slot 
        UNIQUE(restaurant_id, table_id, slot_date, start_time);
        RAISE NOTICE '✅ Constraint añadido';
    ELSE
        RAISE NOTICE '✅ Constraint ya existe';
    END IF;
END $$;

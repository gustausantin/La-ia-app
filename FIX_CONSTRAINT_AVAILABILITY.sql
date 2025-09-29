-- =====================================================
-- FIX: AÑADIR CONSTRAINT ÚNICO A AVAILABILITY_SLOTS
-- =====================================================

-- Verificar si ya existe el constraint
SELECT 
    'CONSTRAINT_EXISTENTE' as verificacion,
    conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'availability_slots'::regclass
AND contype = 'u'; -- unique constraints

-- Añadir el constraint único si no existe
ALTER TABLE availability_slots 
ADD CONSTRAINT IF NOT EXISTS unique_slot_per_table_time 
UNIQUE(restaurant_id, table_id, slot_date, start_time);

-- Verificar que se añadió correctamente
SELECT 
    'CONSTRAINT_AÑADIDO' as verificacion,
    conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'availability_slots'::regclass
AND contype = 'u';

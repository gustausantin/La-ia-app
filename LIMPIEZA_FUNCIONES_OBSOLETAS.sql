-- 🧹 LIMPIEZA DE FUNCIONES RPC OBSOLETAS
-- Eliminar funciones que pueden estar causando conflictos

-- FUNCIONES A ELIMINAR (obsoletas/duplicadas)
DROP FUNCTION IF EXISTS generate_availability_slots_definitivo(uuid, date, date, integer);
DROP FUNCTION IF EXISTS generate_availability_slots_smart(uuid, date, date, integer);
DROP FUNCTION IF EXISTS generate_availability_slots_v2(uuid, date, date, integer);
DROP FUNCTION IF EXISTS generate_availability_slots_world_class(uuid, date, date, integer);
DROP FUNCTION IF EXISTS regenerate_availability_smart(uuid, date, date, integer);
DROP FUNCTION IF EXISTS cleanup_and_regenerate_availability(uuid, date, date);
DROP FUNCTION IF EXISTS smart_cleanup_availability(uuid, date, date);
DROP FUNCTION IF EXISTS daily_availability_maintenance(uuid);
DROP FUNCTION IF EXISTS initialize_availability_system(uuid);
DROP FUNCTION IF EXISTS check_availability_changes_needed(uuid, date, date);
DROP FUNCTION IF EXISTS diagnostic_availability_data(uuid, date);

-- MANTENER ESTAS FUNCIONES ESENCIALES:
-- ✅ generate_availability_slots_smart_check (la que usa el frontend)
-- ✅ check_availability (para validaciones)
-- ✅ detect_availability_changes (trigger)

-- CONFIRMAR LIMPIEZA
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%availability%'
ORDER BY routine_name;

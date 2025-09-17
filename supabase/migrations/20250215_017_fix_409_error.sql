-- CORRECCIÓN QUIRÚRGICA: Solo arreglar error 409 sin cambiar nada más
-- Mantener la función funcionando exactamente como está

-- Verificar si la función existe y eliminarla solo si es necesario
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_availability_slots' 
        AND pg_get_function_identity_arguments(oid) = 'p_restaurant_id uuid, p_start_date date, p_end_date date'
    ) THEN
        DROP FUNCTION generate_availability_slots(uuid, date, date);
    END IF;
END $$;

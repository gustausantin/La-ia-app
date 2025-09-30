-- ============================================
-- FIX: Actualizar trigger handle_table_changes
-- para usar generate_availability_slots_simple
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_table_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Regenerar slots para los próximos 30 días cuando una mesa cambia
    IF TG_OP = 'UPDATE' AND (NEW.is_active != OLD.is_active OR NEW.capacity != OLD.capacity) THEN
        PERFORM generate_availability_slots_simple(
            NEW.restaurant_id, 
            CURRENT_DATE::DATE, 
            (CURRENT_DATE + 30)::DATE
        );
    ELSIF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        PERFORM generate_availability_slots_simple(
            NEW.restaurant_id, 
            CURRENT_DATE::DATE, 
            (CURRENT_DATE + 30)::DATE
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Verificar que el trigger está activo
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tables'
AND trigger_name = 'table_changes_trigger';

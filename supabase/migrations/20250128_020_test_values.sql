-- =====================================================
-- PROBAR VALORES COMUNES PARA rule_type Y action_type
-- =====================================================

DO $$
DECLARE
    test_values TEXT[] := ARRAY['manual', 'auto', 'automatic', 'triggered', 'scheduled', 'event', 'basic', 'advanced'];
    test_actions TEXT[] := ARRAY['send', 'message', 'send_message', 'notification', 'email', 'sms', 'whatsapp'];
    val TEXT;
    test_id UUID;
    test_restaurant_id UUID := gen_random_uuid();
BEGIN
    RAISE NOTICE '🧪 PROBANDO VALORES PARA rule_type...';
    
    -- Probar rule_type
    FOREACH val IN ARRAY test_values
    LOOP
        BEGIN
            test_id := gen_random_uuid();
            INSERT INTO automation_rules (
                id, restaurant_id, name, description, is_active, 
                rule_type, action_type, created_at, updated_at
            ) VALUES (
                test_id, test_restaurant_id, 'TEST_' || val, 'Test', false, 
                val, 'test', now(), now()
            );
            
            RAISE NOTICE '✅ rule_type=% FUNCIONA', val;
            DELETE FROM automation_rules WHERE id = test_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ rule_type=% FALLA: %', val, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '🧪 PROBANDO VALORES PARA action_type...';
    
    -- Probar action_type (usando rule_type que funcione)
    FOREACH val IN ARRAY test_actions
    LOOP
        BEGIN
            test_id := gen_random_uuid();
            INSERT INTO automation_rules (
                id, restaurant_id, name, description, is_active, 
                rule_type, action_type, created_at, updated_at
            ) VALUES (
                test_id, test_restaurant_id, 'TEST_ACTION_' || val, 'Test', false, 
                'manual', val, now(), now()
            );
            
            RAISE NOTICE '✅ action_type=% FUNCIONA', val;
            DELETE FROM automation_rules WHERE id = test_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ action_type=% FALLA: %', val, SQLERRM;
        END;
    END LOOP;
    
    -- Limpiar cualquier registro de prueba que quede
    DELETE FROM automation_rules WHERE restaurant_id = test_restaurant_id;
    
    RAISE NOTICE '🎯 PRUEBAS COMPLETADAS - USA LOS VALORES QUE FUNCIONARON';
END $$;

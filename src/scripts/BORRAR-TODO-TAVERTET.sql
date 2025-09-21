-- =========================================
-- BORRAR TODOS LOS DATOS DE TAVERTET
-- =========================================
-- CUIDADO: Esto borrará TODOS los datos del restaurante Tavertet

BEGIN;

-- Verificar que estamos borrando el restaurante correcto
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    r_name text;
BEGIN
    SELECT name INTO r_name FROM restaurants WHERE id = r_id;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ===== BORRANDO DATOS DE % ===== ⚠️', r_name;
    RAISE NOTICE 'Restaurant ID: %', r_id;
    RAISE NOTICE '';
END $$;

-- ==========================================
-- PASO 1: Contar datos actuales (antes de borrar)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    counts record;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = r_id) as crm_suggestions,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = r_id) as noshow_actions,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = r_id) as messages,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = r_id) as conversations,
        (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = r_id) as tickets,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r_id) as reservations,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = r_id) as customers
    INTO counts;
    
    RAISE NOTICE '📊 DATOS ACTUALES A BORRAR:';
    RAISE NOTICE '--------------------------------';
    RAISE NOTICE '🔔 Alertas CRM: %', counts.crm_suggestions;
    RAISE NOTICE '🚫 No-show actions: %', counts.noshow_actions;
    RAISE NOTICE '📨 Mensajes: %', counts.messages;
    RAISE NOTICE '💬 Conversaciones: %', counts.conversations;
    RAISE NOTICE '🧾 Tickets: %', counts.tickets;
    RAISE NOTICE '📅 Reservas: %', counts.reservations;
    RAISE NOTICE '👥 Clientes: %', counts.customers;
    RAISE NOTICE '--------------------------------';
END $$;

-- ==========================================
-- PASO 2: Borrar datos en orden correcto (por foreign keys)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    deleted_count integer;
BEGIN
    -- 1. Borrar CRM suggestions
    DELETE FROM crm_suggestions WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borradas % alertas CRM', deleted_count;
    
    -- 2. Borrar No-show actions
    DELETE FROM noshow_actions WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borradas % acciones no-show', deleted_count;
    
    -- 3. Borrar Messages
    DELETE FROM messages WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borrados % mensajes', deleted_count;
    
    -- 4. Borrar Conversations
    DELETE FROM conversations WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borradas % conversaciones', deleted_count;
    
    -- 5. Borrar Billing tickets
    DELETE FROM billing_tickets WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borrados % tickets', deleted_count;
    
    -- 6. Borrar Reservations
    DELETE FROM reservations WHERE restaurant_id = r_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borradas % reservas', deleted_count;
    
    -- 7. Borrar Customers (OPCIONAL - comentado por seguridad)
    -- Si quieres mantener los 14 clientes originales, NO ejecutes esta línea
    -- DELETE FROM customers WHERE restaurant_id = r_id;
    -- GET DIAGNOSTICS deleted_count = ROW_COUNT;
    -- RAISE NOTICE '✅ Borrados % clientes', deleted_count;
    
    -- 7b. O si prefieres borrar SOLO los clientes nuevos (creados hoy)
    DELETE FROM customers 
    WHERE restaurant_id = r_id 
    AND DATE(created_at) = CURRENT_DATE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Borrados % clientes creados HOY', deleted_count;
    
END $$;

-- ==========================================
-- PASO 3: Verificar que todo se borró
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    counts record;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = r_id) as crm_suggestions,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = r_id) as noshow_actions,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = r_id) as messages,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = r_id) as conversations,
        (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = r_id) as tickets,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r_id) as reservations,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = r_id) as customers
    INTO counts;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICACIÓN FINAL:';
    RAISE NOTICE '--------------------------------';
    RAISE NOTICE '🔔 Alertas CRM restantes: %', counts.crm_suggestions;
    RAISE NOTICE '🚫 No-show actions restantes: %', counts.noshow_actions;
    RAISE NOTICE '📨 Mensajes restantes: %', counts.messages;
    RAISE NOTICE '💬 Conversaciones restantes: %', counts.conversations;
    RAISE NOTICE '🧾 Tickets restantes: %', counts.tickets;
    RAISE NOTICE '📅 Reservas restantes: %', counts.reservations;
    RAISE NOTICE '👥 Clientes restantes: %', counts.customers;
    RAISE NOTICE '--------------------------------';
    
    IF counts.crm_suggestions = 0 AND counts.noshow_actions = 0 AND 
       counts.messages = 0 AND counts.conversations = 0 AND 
       counts.tickets = 0 AND counts.reservations = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ ¡LIMPIEZA COMPLETA EXITOSA!';
        RAISE NOTICE '✅ Ahora puedes ejecutar el script MASIVO-GARANTIZADO-TAVERTET.sql';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Aún quedan algunos datos. Revisa si es correcto.';
    END IF;
END $$;

COMMIT;

-- ==========================================
-- NOTA IMPORTANTE:
-- ==========================================
-- Este script borra TODOS los datos del restaurante Tavertet
-- EXCEPTO los clientes (por defecto los mantiene)
-- 
-- Si quieres borrar TODO incluyendo clientes:
-- 1. Descomenta la línea 87-89 
-- 2. Comenta las líneas 92-95
--
-- Después de ejecutar este script, ejecuta:
-- MASIVO-GARANTIZADO-TAVERTET.sql
-- ==========================================

-- =========================================
-- SCRIPT DE LIMPIEZA DE DATOS DUPLICADOS
-- =========================================
-- Este script limpia COMPLETAMENTE todos los datos del restaurante demo
-- para evitar duplicaciones al ejecutar múltiples veces

BEGIN;

-- ==========================================
-- LIMPIAR TODAS LAS TABLAS EN ORDEN CORRECTO
-- ==========================================

-- Eliminar en orden de dependencias (foreign keys)
DELETE FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM availability_slots WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM message_templates WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM crm_templates WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
DELETE FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');

-- Verificar limpieza
DO $$
DECLARE
    total_customers INTEGER;
    total_reservations INTEGER;
    total_tickets INTEGER;
    total_conversations INTEGER;
    total_messages INTEGER;
    total_tables INTEGER;
BEGIN
    -- Contar registros después de limpieza
    SELECT COUNT(*) INTO total_customers FROM customers WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_reservations FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_tickets FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_conversations FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_messages FROM messages WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    SELECT COUNT(*) INTO total_tables FROM tables WHERE restaurant_id IN (SELECT id FROM restaurants WHERE name = 'Restaurante Demo');
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 ===== LIMPIEZA COMPLETADA ===== 🧹';
    RAISE NOTICE '';
    RAISE NOTICE '📊 REGISTROS DESPUÉS DE LIMPIEZA:';
    RAISE NOTICE '👥 Clientes: %', total_customers;
    RAISE NOTICE '🍽️ Mesas: %', total_tables;
    RAISE NOTICE '📅 Reservas: %', total_reservations;
    RAISE NOTICE '🧾 Tickets: %', total_tickets;
    RAISE NOTICE '💬 Conversaciones: %', total_conversations;
    RAISE NOTICE '📨 Mensajes: %', total_messages;
    RAISE NOTICE '';
    RAISE NOTICE '✅ BASE DE DATOS LIMPIA - LISTA PARA NUEVA CARGA';
    RAISE NOTICE '🚀 AHORA EJECUTA create-COMPLETE-restaurant-life.sql UNA SOLA VEZ';
END $$;

COMMIT;

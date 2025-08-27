-- 💣 SCRIPT NUCLEAR - LIMPIEZA TOTAL DE TODAS LAS TABLAS
-- ⚠️⚠️⚠️ PELIGRO MÁXIMO - ELIMINA ABSOLUTAMENTE TODO ⚠️⚠️⚠️
-- 🗑️ DEJA LAS TABLAS COMPLETAMENTE VACÍAS
-- 🧹 ÚSALO SOLO SI QUIERES EMPEZAR DESDE CERO

-- 🚨 FUNCIÓN DE LIMPIEZA NUCLEAR
CREATE OR REPLACE FUNCTION nuclear_cleanup_all_tables()
RETURNS TEXT AS $$
DECLARE
    cleanup_result TEXT := '';
    row_count INTEGER;
    table_record RECORD;
    total_deleted INTEGER := 0;
BEGIN
    cleanup_result := '💣 INICIANDO LIMPIEZA NUCLEAR DE TODAS LAS TABLAS' || E'\n';
    cleanup_result := cleanup_result || '⚠️ ESTO ELIMINARÁ ABSOLUTAMENTE TODO' || E'\n' || E'\n';
    
    -- DESACTIVAR TEMPORALMENTE RLS PARA ELIMINAR TODO
    SET row_security = off;
    
    -- 1. ELIMINAR EN ORDEN CORRECTO (dependientes primero)
    
    -- 1.1 Notifications
    DELETE FROM public.notifications;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '🔔 notifications: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.2 Messages
    DELETE FROM public.messages;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '💬 messages: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.3 Conversations
    DELETE FROM public.conversations;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '🗨️ conversations: ' || row_count || ' eliminadas' || E'\n';
    
    -- 1.4 Message Templates
    DELETE FROM public.message_templates;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📝 message_templates: ' || row_count || ' eliminadas' || E'\n';
    
    -- 1.5 Analytics
    DELETE FROM public.analytics;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📊 analytics: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.6 Analytics Historical
    DELETE FROM public.analytics_historical;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📈 analytics_historical: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.7 Daily Metrics
    DELETE FROM public.daily_metrics;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📅 daily_metrics: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.8 Inventory Items
    DELETE FROM public.inventory_items;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📦 inventory_items: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.9 Inventory
    DELETE FROM public.inventory;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📋 inventory: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.10 Staff
    DELETE FROM public.staff;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '👨‍💼 staff: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.11 Restaurant Settings
    DELETE FROM public.restaurant_settings;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '⚙️ restaurant_settings: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.12 Reservations
    DELETE FROM public.reservations;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '📅 reservations: ' || row_count || ' eliminadas' || E'\n';
    
    -- 1.13 Customers
    DELETE FROM public.customers;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '👤 customers: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.14 Tables
    DELETE FROM public.tables;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '🪑 tables: ' || row_count || ' eliminadas' || E'\n';
    
    -- 1.15 User Restaurant Mapping
    DELETE FROM public.user_restaurant_mapping;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '🔗 user_restaurant_mapping: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.16 Profiles
    DELETE FROM public.profiles;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '👤 profiles: ' || row_count || ' eliminados' || E'\n';
    
    -- 1.17 Restaurants (LA PRINCIPAL)
    DELETE FROM public.restaurants;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    cleanup_result := cleanup_result || '🏢 restaurants: ' || row_count || ' eliminados' || E'\n';
    
    -- ⚠️ OPCIONAL: Eliminar usuarios de auth (DESCOMENTA SI QUIERES)
    -- DELETE FROM auth.users WHERE email NOT LIKE '%@supabase.io';
    -- GET DIAGNOSTICS row_count = ROW_COUNT;
    -- total_deleted := total_deleted + row_count;
    -- cleanup_result := cleanup_result || '🔑 auth.users: ' || row_count || ' eliminados' || E'\n';
    
    -- REACTIVAR RLS
    SET row_security = on;
    
    cleanup_result := cleanup_result || E'\n';
    cleanup_result := cleanup_result || '💥 LIMPIEZA NUCLEAR COMPLETADA' || E'\n';
    cleanup_result := cleanup_result || '📊 TOTAL REGISTROS ELIMINADOS: ' || total_deleted || E'\n';
    cleanup_result := cleanup_result || '🧹 TODAS LAS TABLAS ESTÁN COMPLETAMENTE VACÍAS' || E'\n';
    cleanup_result := cleanup_result || '✅ LISTO PARA REGISTRAR NUEVOS USUARIOS' || E'\n';
    
    RETURN cleanup_result;
    
EXCEPTION WHEN OTHERS THEN
    -- REACTIVAR RLS en caso de error
    SET row_security = on;
    RETURN '❌ ERROR DURANTE LIMPIEZA: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔍 FUNCIÓN PARA VERIFICAR QUE TODO ESTÁ VACÍO
CREATE OR REPLACE FUNCTION verify_tables_empty()
RETURNS TEXT AS $$
DECLARE
    verification_result TEXT := '';
    row_count INTEGER;
    total_rows INTEGER := 0;
BEGIN
    verification_result := '🔍 VERIFICANDO QUE TODAS LAS TABLAS ESTÁN VACÍAS:' || E'\n' || E'\n';
    
    -- Verificar cada tabla
    SELECT COUNT(*) INTO row_count FROM public.restaurants;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '🏢 restaurants: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.user_restaurant_mapping;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '🔗 user_restaurant_mapping: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.profiles;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '👤 profiles: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.customers;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '👤 customers: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.reservations;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '📅 reservations: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.tables;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '🪑 tables: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.conversations;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '🗨️ conversations: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.messages;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '💬 messages: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.notifications;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '🔔 notifications: ' || row_count || ' registros' || E'\n';
    
    SELECT COUNT(*) INTO row_count FROM public.analytics;
    total_rows := total_rows + row_count;
    verification_result := verification_result || '📊 analytics: ' || row_count || ' registros' || E'\n';
    
    verification_result := verification_result || E'\n';
    
    IF total_rows = 0 THEN
        verification_result := verification_result || '✅ PERFECTO: TODAS LAS TABLAS ESTÁN COMPLETAMENTE VACÍAS' || E'\n';
        verification_result := verification_result || '🎯 LISTO PARA REGISTRAR NUEVOS USUARIOS SIN PROBLEMAS';
    ELSE
        verification_result := verification_result || '⚠️ ATENCIÓN: AÚN QUEDAN ' || total_rows || ' REGISTROS' || E'\n';
        verification_result := verification_result || '🔄 EJECUTA nuclear_cleanup_all_tables() NUEVAMENTE';
    END IF;
    
    RETURN verification_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📋 INSTRUCCIONES DE USO:

-- 1. 💣 PARA LIMPIAR TODO (CUIDADO - ELIMINA ABSOLUTAMENTE TODO):
-- SELECT nuclear_cleanup_all_tables();

-- 2. 🔍 PARA VERIFICAR QUE TODO ESTÁ VACÍO:
-- SELECT verify_tables_empty();

-- 3. 🔄 SI QUEDA ALGO, EJECUTA LIMPIEZA NUEVAMENTE:
-- SELECT nuclear_cleanup_all_tables();

-- ⚠️⚠️⚠️ ADVERTENCIAS IMPORTANTES ⚠️⚠️⚠️
-- • ESTO ELIMINA ABSOLUTAMENTE TODOS LOS DATOS
-- • NO HAY VUELTA ATRÁS
-- • SOLO ÚSALO SI QUIERES EMPEZAR DESDE CERO
-- • LAS TABLAS QUEDARÁN COMPLETAMENTE VACÍAS
-- • DESPUÉS PODRÁS REGISTRAR USUARIOS NUEVOS SIN PROBLEMAS

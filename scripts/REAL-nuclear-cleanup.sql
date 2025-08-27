-- 💣 SCRIPT NUCLEAR REAL - BASADO EN TUS TABLAS REALES
-- ⚠️ ELIMINA TODO DE TODAS LAS TABLAS QUE REALMENTE EXISTEN

CREATE OR REPLACE FUNCTION real_nuclear_cleanup()
RETURNS TEXT AS $$
DECLARE
    cleanup_result TEXT := '';
    row_count INTEGER;
    total_deleted INTEGER := 0;
BEGIN
    cleanup_result := '💣 LIMPIEZA NUCLEAR REAL - TODAS LAS TABLAS' || E'\n' || E'\n';
    
    -- DESACTIVAR RLS TEMPORALMENTE
    SET row_security = off;
    
    -- TRUNCATE es más rápido y seguro que DELETE para limpiar completamente
    -- ORDEN: de más dependientes a menos dependientes
    
    -- 1. Tablas de agent (las que vi en tu pantalla)
    BEGIN
        TRUNCATE TABLE public.agent_conversations RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🤖 agent_conversations: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.agent_conversations;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🤖 agent_conversations: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.agent_insights RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🧠 agent_insights: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.agent_insights;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🧠 agent_insights: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.agent_metrics RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📊 agent_metrics: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.agent_metrics;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📊 agent_metrics: ' || row_count || ' deleted' || E'\n';
    END;
    
    -- 2. Channel y conversation analytics
    BEGIN
        TRUNCATE TABLE public.channel_performance RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📈 channel_performance: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.channel_performance;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📈 channel_performance: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.conversation_analytics RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🗨️ conversation_analytics: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.conversation_analytics;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🗨️ conversation_analytics: ' || row_count || ' deleted' || E'\n';
    END;
    
    -- 3. Todas las demás tablas que vi en tu interfaz
    BEGIN
        TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🔔 notifications: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.notifications;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🔔 notifications: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.messages RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '💬 messages: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.messages;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '💬 messages: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.conversations RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🗨️ conversations: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.conversations;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🗨️ conversations: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.message_templates RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📝 message_templates: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.message_templates;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📝 message_templates: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.analytics RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📊 analytics: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.analytics;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📊 analytics: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.analytics_historical RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📈 analytics_historical: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.analytics_historical;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📈 analytics_historical: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.daily_metrics RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📅 daily_metrics: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.daily_metrics;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📅 daily_metrics: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.inventory_items RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📦 inventory_items: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.inventory_items;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📦 inventory_items: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.inventory RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📋 inventory: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.inventory;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📋 inventory: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.staff RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '👨‍💼 staff: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.staff;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '👨‍💼 staff: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.restaurant_settings RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '⚙️ restaurant_settings: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.restaurant_settings;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '⚙️ restaurant_settings: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.restaurant_business_config RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🏪 restaurant_business_config: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.restaurant_business_config;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🏪 restaurant_business_config: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.reservations RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📅 reservations: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.reservations;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📅 reservations: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.reservations_with_customer RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '📅 reservations_with_customer: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.reservations_with_customer;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '📅 reservations_with_customer: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.customers RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '👤 customers: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.customers;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '👤 customers: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.tables RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🪑 tables: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.tables;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🪑 tables: ' || row_count || ' deleted' || E'\n';
    END;
    
    -- CRÍTICO: User mapping y profiles
    BEGIN
        TRUNCATE TABLE public.user_restaurant_mapping RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🔗 user_restaurant_mapping: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.user_restaurant_mapping;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🔗 user_restaurant_mapping: ' || row_count || ' deleted' || E'\n';
    END;
    
    BEGIN
        TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '👤 profiles: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.profiles;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '👤 profiles: ' || row_count || ' deleted' || E'\n';
    END;
    
    -- FINAL: Restaurants (la tabla principal)
    BEGIN
        TRUNCATE TABLE public.restaurants RESTART IDENTITY CASCADE;
        cleanup_result := cleanup_result || '🏢 restaurants: TRUNCATED' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.restaurants;
        GET DIAGNOSTICS row_count = ROW_COUNT;
        cleanup_result := cleanup_result || '🏢 restaurants: ' || row_count || ' deleted' || E'\n';
    END;
    
    -- REACTIVAR RLS
    SET row_security = on;
    
    cleanup_result := cleanup_result || E'\n';
    cleanup_result := cleanup_result || '💥 LIMPIEZA NUCLEAR COMPLETADA' || E'\n';
    cleanup_result := cleanup_result || '🧹 TODAS LAS TABLAS ESTÁN COMPLETAMENTE VACÍAS' || E'\n';
    cleanup_result := cleanup_result || '✅ LISTO PARA REGISTRAR NUEVOS USUARIOS' || E'\n';
    
    RETURN cleanup_result;
    
EXCEPTION WHEN OTHERS THEN
    SET row_security = on;
    RETURN '❌ ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EJECUTAR ESTE:
-- SELECT real_nuclear_cleanup();

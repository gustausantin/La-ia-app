-- =========================================
-- DOCUMENTACIÓN COMPLETA DE TODAS LAS TABLAS
-- =========================================
-- Descripción: Script completo para documentar TODA la estructura de la BD
-- Objetivo: NUNCA MÁS trabajar a ciegas
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

-- ==========================================
-- 1. LISTAR TODAS LAS TABLAS EXISTENTES
-- ==========================================

-- === 🗄️  TODAS LAS TABLAS EN LA BASE DE DATOS ===
SELECT 
    '=== TODAS LAS TABLAS ===' as seccion,
    schemaname as schema,
    tablename as tabla,
    tableowner as propietario,
    hasindexes as tiene_indices,
    hasrules as tiene_reglas,
    hastriggers as tiene_triggers
FROM pg_tables 
WHERE schemaname = 'public'ORDER BY tablename;

-- ==========================================
-- 2. ESTRUCTURA DETALLADA DE CADA TABLA
-- ==========================================

-- === 📋 ESTRUCTURA COMPLETA DE TODAS LAS TABLAS ===

-- Información completa de columnas para TODAS las tablas
SELECT 
    t.table_name as tabla,
    c.column_name as columna,
    c.data_type as tipo_dato,
    c.character_maximum_length as longitud_max,
    c.is_nullable as permite_null,
    c.column_default as valor_default,
    c.ordinal_position as posicion
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ==========================================
-- 3. CONSTRAINTS Y CLAVES
-- ==========================================

-- === 🔑 CLAVES PRIMARIAS Y CONSTRAINTS ===

-- Primary Keys
SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna_pk,
    tc.constraint_type as tipo_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = PRIMARY KEYAND tc.table_schema = publicORDER BY tc.table_name;

-- Foreign Keys
SELECT 
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_referencia,
    ccu.column_name as columna_referencia,
    tc.constraint_name as nombre_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = FOREIGN KEYAND tc.table_schema = publicORDER BY tc.table_name;

-- Check Constraints
SELECT 
    tc.table_name as tabla,
    tc.constraint_name as nombre_constraint,
    cc.check_clause as condicion
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = CHECKAND tc.table_schema = publicORDER BY tc.table_name;

-- ==========================================
-- 4. ÍNDICES
-- ==========================================

-- === 📇 ÍNDICES DE TODAS LAS TABLAS ===

SELECT 
    schemaname as schema,
    tablename as tabla,
    indexname as nombre_indice,
    indexdef as definicion_indice
FROM pg_indexes 
WHERE schemaname = 'public'ORDER BY tablename, indexname;

-- ==========================================
-- 5. TRIGGERS Y FUNCIONES
-- ==========================================

-- === ⚡ TRIGGERS Y FUNCIONES ===

-- Triggers
SELECT 
    trigger_name as nombre_trigger,
    event_object_table as tabla,
    action_timing as momento,
    event_manipulation as evento,
    action_statement as accion
FROM information_schema.triggers
WHERE trigger_schema = publicORDER BY event_object_table;

-- Funciones RPC (Supabase)
SELECT 
    routine_name as nombre_funcion,
    routine_type as tipo,
    data_type as tipo_retorno,
    routine_definition as definicion
FROM information_schema.routines
WHERE routine_schema = publicAND routine_type = FUNCTIONORDER BY routine_name;

-- ==========================================
-- 6. DATOS DE EJEMPLO DE CADA TABLA
-- ==========================================

-- === 📊 DATOS DE EJEMPLO DE CADA TABLA ===

-- Función dinámica para mostrar datos de ejemplo
DO $$
DECLARE
    tabla_record RECORD;
    sql_query TEXT;
    resultado TEXT;
BEGIN
    FOR tabla_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    LOOP
        BEGIN
            RAISE NOTICE === TABLA: % ===, tabla_record.tablename;
            
            -- Construir query dinámicamente
            sql_query := SELECT COUNT(*) as total_registros FROM  || tabla_record.tablename;
            EXECUTE sql_query INTO resultado;
            RAISE NOTICE Total registros: %, resultado;
            
            -- Mostrar primeros 3 registros
            sql_query := SELECT * FROM  || tabla_record.tablename ||  LIMIT 3;
            RAISE NOTICE Ejecutando: %, sql_query;
            
            -- Nota: En producción mostraremos los datos reales
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE Error consultando tabla %: %, tabla_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- ==========================================
-- 7. TABLAS ESPECÍFICAS CRÍTICAS
-- ==========================================

-- === 🎯 ANÁLISIS DETALLADO DE TABLAS CRÍTICAS ===

-- CUSTOMERS - Estructura detallada
-- --- TABLA CUSTOMERS ---
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = customersORDER BY ordinal_position;

-- RESERVATIONS - Estructura detallada  
-- --- TABLA RESERVATIONS ---
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = reservationsORDER BY ordinal_position;

-- RESTAURANTS - Estructura detallada
-- --- TABLA RESTAURANTS ---
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = restaurantsORDER BY ordinal_position;

-- NOSHOW_ACTIONS - Estructura detallada (si existe)
----- TABLA NOSHOW_ACTIONS ---SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = noshow_actionsORDER BY ordinal_position;

-- CONVERSATIONS - Estructura detallada
----- TABLA CONVERSATIONS ---SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = conversationsORDER BY ordinal_position;

-- MESSAGES - Estructura detallada
----- TABLA MESSAGES ---SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = messagesORDER BY ordinal_position;

-- AVAILABILITY_SLOTS - Estructura detallada
----- TABLA AVAILABILITY_SLOTS ---SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = availability_slotsORDER BY ordinal_position;

-- TABLES (mesas) - Estructura detallada
----- TABLA TABLES ---SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = tablesORDER BY ordinal_position;

-- ==========================================
-- 8. POLÍTICAS RLS (Row Level Security)
-- ==========================================

--=== 🔒 POLÍTICAS RLS ===
SELECT 
    schemaname as schema,
    tablename as tabla,
    policyname as politica,
    permissive as permisivo,
    roles as roles,
    cmd as comando,
    qual as condicion
FROM pg_policies
WHERE schemaname = 'public'ORDER BY tablename, policyname;

-- ==========================================
-- 9. PERMISOS Y ROLES
-- ==========================================

--=== 👥 PERMISOS Y ROLES ===
SELECT 
    grantee as usuario,
    table_name as tabla,
    privilege_type as permiso,
    is_grantable as puede_otorgar
FROM information_schema.role_table_grants
WHERE table_schema = 'public'ORDER BY table_name, grantee;

-- ==========================================
-- 10. RESUMEN EJECUTIVO
-- ==========================================

--=== 📈 RESUMEN EJECUTIVO ===
SELECT 
    'Tablas totales' as metrica,
    COUNT(*) as valor
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL

SELECT 
    'Columnas totales' as metrica,
    COUNT(*) as valor
FROM information_schema.columns 
WHERE table_schema = 'public'
UNION ALL

SELECT 
    'Constraints totales' as metrica,
    COUNT(*) as valor
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
UNION ALL

SELECT 
    'Índices totales' as metrica,
    COUNT(*) as valor
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL

SELECT 
    'Funciones RPC' as metrica,
    COUNT(*) as valor
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- ==========================================
-- 11. COMANDO PARA EXPORTAR RESULTADO
-- ==========================================

-- === 💾 COMANDO PARA GUARDAR DOCUMENTACIÓN ===
-- Para guardar este resultado en un archivo:
-- En psql: \o database_schema_documentation.txt
-- Luego ejecuta este script completo
-- En psql: \o

-- === ✅ SCRIPT LISTO PARA EJECUTAR EN SUPABASE ===
-- =========================================
-- DOCUMENTACIÓN SIMPLE DE BASE DE DATOS
-- =========================================
-- Script simplificado para documentar estructura
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

-- ==========================================
-- 1. TODAS LAS TABLAS
-- ==========================================
SELECT 
    tablename as tabla,
    tableowner as propietario
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ==========================================
-- 2. COLUMNAS DE CADA TABLA
-- ==========================================
SELECT 
    table_name as tabla,
    column_name as columna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ==========================================
-- 3. CLAVES PRIMARIAS
-- ==========================================
SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna_pk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 4. CLAVES FORÁNEAS
-- ==========================================
SELECT 
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_referencia,
    ccu.column_name as columna_referencia
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 5. CONSTRAINTS CHECK
-- ==========================================
SELECT 
    tc.table_name as tabla,
    tc.constraint_name as nombre_constraint,
    cc.check_clause as condicion
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 6. FUNCIONES RPC
-- ==========================================
SELECT 
    routine_name as nombre_funcion,
    data_type as tipo_retorno
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 7. ANÁLISIS POR TABLA ESPECÍFICA
-- ==========================================

-- CUSTOMERS
SELECT 'CUSTOMERS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- RESERVATIONS  
SELECT 'RESERVATIONS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- RESTAURANTS
SELECT 'RESTAURANTS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND table_schema = 'public'
ORDER BY ordinal_position;

-- NOSHOW_ACTIONS (si existe)
SELECT 'NOSHOW_ACTIONS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'noshow_actions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- CONVERSATIONS
SELECT 'CONVERSATIONS' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- MESSAGES
SELECT 'MESSAGES' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 8. RESUMEN FINAL
-- ==========================================
SELECT 
    COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

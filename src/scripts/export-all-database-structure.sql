-- =========================================
-- EXPORTAR TODA LA ESTRUCTURA DE LA BASE DE DATOS
-- =========================================
-- Script para exportar TODA la información de las 41 tablas
-- Para copiar y pegar al asistente
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

-- ==========================================
-- 1. LISTA COMPLETA DE LAS 41 TABLAS
-- ==========================================
SELECT 
    'TABLA: ' || tablename as info_tabla
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ==========================================
-- 2. ESTRUCTURA COMPLETA DE TODAS LAS TABLAS
-- ==========================================
SELECT 
    'TABLA: ' || table_name || 
    ' | COLUMNA: ' || column_name || 
    ' | TIPO: ' || data_type || 
    ' | NULL: ' || is_nullable || 
    ' | DEFAULT: ' || COALESCE(column_default, 'NULL') ||
    ' | POSICION: ' || ordinal_position::text as estructura_completa
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ==========================================
-- 3. TODAS LAS CLAVES PRIMARIAS
-- ==========================================
SELECT 
    'PK: ' || tc.table_name || ' -> ' || kcu.column_name as claves_primarias
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 4. TODAS LAS CLAVES FORÁNEAS
-- ==========================================
SELECT 
    'FK: ' || tc.table_name || '.' || kcu.column_name || 
    ' -> ' || ccu.table_name || '.' || ccu.column_name as claves_foraneas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 5. TODOS LOS CONSTRAINTS CHECK
-- ==========================================
SELECT 
    'CHECK: ' || tc.table_name || ' -> ' || tc.constraint_name || 
    ' -> ' || cc.check_clause as check_constraints
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 6. TODAS LAS FUNCIONES RPC
-- ==========================================
SELECT 
    'FUNCION: ' || routine_name || 
    ' | RETORNA: ' || data_type as funciones_rpc
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 7. TODOS LOS ÍNDICES
-- ==========================================
SELECT 
    'INDICE: ' || indexname || ' -> ' || tablename || 
    ' -> ' || indexdef as indices_completos
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==========================================
-- 8. POLÍTICAS RLS (Row Level Security)
-- ==========================================
SELECT 
    'RLS: ' || tablename || ' -> ' || policyname || 
    ' -> ' || cmd || ' -> ' || COALESCE(qual, 'SIN_CONDICION') as politicas_rls
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- 9. TRIGGERS
-- ==========================================
SELECT 
    'TRIGGER: ' || trigger_name || ' -> ' || event_object_table || 
    ' -> ' || action_timing || ' ' || event_manipulation as triggers_completos
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ==========================================
-- 10. DATOS DE EJEMPLO DE CADA TABLA
-- ==========================================
-- CUSTOMERS
SELECT 'DATOS_CUSTOMERS: ' || COALESCE(id::text, 'NULL') || ' | ' || 
       COALESCE(name, 'NULL') || ' | ' || 
       COALESCE(phone, 'NULL') || ' | ' || 
       COALESCE(email, 'NULL') as datos_customers
FROM customers LIMIT 3;

-- RESERVATIONS
SELECT 'DATOS_RESERVATIONS: ' || COALESCE(id::text, 'NULL') || ' | ' || 
       COALESCE(customer_name, 'NULL') || ' | ' || 
       COALESCE(reservation_date::text, 'NULL') || ' | ' || 
       COALESCE(reservation_time::text, 'NULL') || ' | ' || 
       COALESCE(party_size::text, 'NULL') || ' | ' || 
       COALESCE(status, 'NULL') as datos_reservations
FROM reservations LIMIT 3;

-- RESTAURANTS
SELECT 'DATOS_RESTAURANTS: ' || COALESCE(id::text, 'NULL') || ' | ' || 
       COALESCE(name, 'NULL') || ' | ' || 
       COALESCE(phone, 'NULL') || ' | ' || 
       COALESCE(email, 'NULL') as datos_restaurants
FROM restaurants LIMIT 3;

-- ==========================================
-- 11. RESUMEN ESTADÍSTICO FINAL
-- ==========================================
SELECT 
    'RESUMEN: Tablas=' || 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text ||
    ' | Columnas=' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public')::text ||
    ' | PKs=' || 
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'PRIMARY KEY')::text ||
    ' | FKs=' || 
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY')::text ||
    ' | Funciones=' || 
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION')::text as resumen_final;

-- ==========================================
-- 12. INSTRUCCIONES PARA EL ASISTENTE
-- ==========================================
SELECT 
    '=== INSTRUCCIONES ===' ||
    ' Copia TODOS los resultados de este script y pégalos al asistente.' ||
    ' El asistente podrá crear scripts perfectos conociendo toda la estructura.' ||
    ' Total de tablas: 41' ||
    ' ¡NUNCA MÁS errores de columnas!' as instrucciones_finales;

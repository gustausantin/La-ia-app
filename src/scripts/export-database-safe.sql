-- =========================================
-- EXPORTAR BASE DE DATOS - VERSIÓN SEGURA
-- =========================================
-- Script robusto que maneja todos los tipos de datos
-- Autor: LA-IA System
-- Fecha: 20 Septiembre 2025

-- ==========================================
-- 1. LISTA DE TODAS LAS TABLAS
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
    'ESTRUCTURA: ' || table_name || 
    ' | COLUMNA: ' || column_name || 
    ' | TIPO: ' || data_type || 
    ' | NULL: ' || is_nullable || 
    ' | DEFAULT: ' || COALESCE(column_default, 'NULL') ||
    ' | POSICION: ' || ordinal_position::text as estructura_completa
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ==========================================
-- 3. CLAVES PRIMARIAS
-- ==========================================
SELECT 
    'PK: ' || tc.table_name || ' -> ' || kcu.column_name as claves_primarias
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ==========================================
-- 4. CLAVES FORÁNEAS
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
-- 5. CHECK CONSTRAINTS
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
-- 6. FUNCIONES RPC
-- ==========================================
SELECT 
    'FUNCION: ' || routine_name || 
    ' | RETORNA: ' || data_type as funciones_rpc
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 7. DATOS DE EJEMPLO - CUSTOMERS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        RAISE NOTICE 'DATOS_CUSTOMERS_INICIO';
        PERFORM 'DATOS_CUSTOMERS: ' || COALESCE(id::text, 'NULL') || ' | ' || 
               COALESCE(name, 'NULL') || ' | ' || 
               COALESCE(phone, 'NULL') || ' | ' || 
               COALESCE(email, 'NULL')
        FROM customers LIMIT 3;
        RAISE NOTICE 'DATOS_CUSTOMERS_FIN';
    ELSE
        RAISE NOTICE 'TABLA customers NO EXISTE';
    END IF;
END $$;

-- ==========================================
-- 8. DATOS DE EJEMPLO - RESERVATIONS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations' AND table_schema = 'public') THEN
        RAISE NOTICE 'DATOS_RESERVATIONS_INICIO';
        -- Usar RAISE NOTICE para mostrar datos sin problemas de tipos
        FOR rec IN 
            SELECT id, customer_name, reservation_date, reservation_time, party_size, status
            FROM reservations LIMIT 3
        LOOP
            RAISE NOTICE 'DATOS_RESERVATIONS: % | % | % | % | % | %', 
                COALESCE(rec.id::text, 'NULL'),
                COALESCE(rec.customer_name, 'NULL'),
                COALESCE(rec.reservation_date::text, 'NULL'),
                COALESCE(rec.reservation_time::text, 'NULL'),
                COALESCE(rec.party_size::text, 'NULL'),
                COALESCE(rec.status, 'NULL');
        END LOOP;
        RAISE NOTICE 'DATOS_RESERVATIONS_FIN';
    ELSE
        RAISE NOTICE 'TABLA reservations NO EXISTE';
    END IF;
END $$;

-- ==========================================
-- 9. DATOS DE EJEMPLO - RESTAURANTS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants' AND table_schema = 'public') THEN
        RAISE NOTICE 'DATOS_RESTAURANTS_INICIO';
        FOR rec IN 
            SELECT id, name, phone, email
            FROM restaurants LIMIT 3
        LOOP
            RAISE NOTICE 'DATOS_RESTAURANTS: % | % | % | %', 
                COALESCE(rec.id::text, 'NULL'),
                COALESCE(rec.name, 'NULL'),
                COALESCE(rec.phone, 'NULL'),
                COALESCE(rec.email, 'NULL');
        END LOOP;
        RAISE NOTICE 'DATOS_RESTAURANTS_FIN';
    ELSE
        RAISE NOTICE 'TABLA restaurants NO EXISTE';
    END IF;
END $$;

-- ==========================================
-- 10. RESUMEN FINAL
-- ==========================================
SELECT 
    'RESUMEN_FINAL: Tablas=' || 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::text ||
    ' | Columnas=' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public')::text ||
    ' | PKs=' || 
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'PRIMARY KEY')::text ||
    ' | FKs=' || 
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY')::text as resumen_final;

-- ==========================================
-- 11. INSTRUCCIONES FINALES
-- ==========================================
SELECT 
    '=== EXPORTACION COMPLETA ===' ||
    ' Copia TODOS los resultados y mensajes NOTICE.' ||
    ' Incluye tanto los SELECT como los NOTICE del log.' ||
    ' Total tablas: 41' as instrucciones_finales;

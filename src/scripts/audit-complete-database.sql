-- ✅ AUDITORÍA COMPLETA DE BASE DE DATOS LA-IA APP
-- Este script genera un reporte exhaustivo de TODA la infraestructura

-- =============================================================================
-- 1. AUDITORÍA DE SEGURIDAD - RLS Y POLÍTICAS
-- =============================================================================

-- Verificar RLS en TODAS las tablas
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO - RIESGO CRÍTICO'
    END as rls_status,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- Contar políticas por tabla
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ SIN POLÍTICAS - RIESGO CRÍTICO'
        WHEN COUNT(*) < 2 THEN '⚠️ POCAS POLÍTICAS'
        ELSE '✅ POLÍTICAS SUFICIENTES'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies ASC;

-- =============================================================================
-- 2. ESTRUCTURA COMPLETA DE TABLAS
-- =============================================================================

-- Listar TODAS las tablas y sus columnas
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN '🔑 PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN '🔗 FOREIGN KEY'
        ELSE ''
    END as key_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT kcu.column_name, kcu.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT kcu.column_name, kcu.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- =============================================================================
-- 3. FUNCIONES Y PROCEDIMIENTOS
-- =============================================================================

-- Listar todas las funciones RPC
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =============================================================================
-- 4. ÍNDICES Y PERFORMANCE
-- =============================================================================

-- Verificar índices en columnas críticas
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- 5. PERMISOS Y ROLES
-- =============================================================================

-- Verificar permisos en tablas
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
ORDER BY table_name, grantee;

-- =============================================================================
-- 6. CONSTRAINTS Y VALIDACIONES
-- =============================================================================

-- Verificar constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- =============================================================================
-- 7. FOREIGN KEYS Y RELACIONES
-- =============================================================================

-- Verificar relaciones entre tablas
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================================================
-- 8. ESTADÍSTICAS DE DATOS
-- =============================================================================

-- Contar registros en cada tabla (para detectar tablas vacías o problemas)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY current_rows DESC;

-- =============================================================================
-- ✅ RESUMEN FINAL
-- =============================================================================

-- Resumen de seguridad crítica
SELECT 
    'TABLAS SIN RLS' as issue_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PERFECTO'
        ELSE '❌ RIESGO CRÍTICO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND NOT rowsecurity

UNION ALL

SELECT 
    'TABLAS SIN POLÍTICAS' as issue_type,
    COUNT(DISTINCT t.tablename) as count,
    CASE 
        WHEN COUNT(DISTINCT t.tablename) = 0 THEN '✅ PERFECTO'
        ELSE '❌ RIESGO CRÍTICO'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true 
    AND p.tablename IS NULL;

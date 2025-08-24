-- ============================================================================
-- SCRIPT: ARREGLAR ERRORES DE SCHEMA RESTANTES
-- ============================================================================
-- SOLUCIÓN DEFINITIVA ENTERPRISE para errores de columnas faltantes
-- ============================================================================

-- 🔍 DIAGNÓSTICO: Verificar estructura actual
DO $$
DECLARE
    reservations_cols text[];
    tables_cols text[];
BEGIN
    -- Verificar columnas de reservations
    SELECT array_agg(column_name) INTO reservations_cols
    FROM information_schema.columns 
    WHERE table_name = 'reservations' AND table_schema = 'public';
    
    RAISE NOTICE '📋 RESERVATIONS tiene columnas: %', reservations_cols;
    
    -- Verificar columnas de tables
    SELECT array_agg(column_name) INTO tables_cols
    FROM information_schema.columns 
    WHERE table_name = 'tables' AND table_schema = 'public';
    
    RAISE NOTICE '📋 TABLES tiene columnas: %', tables_cols;
END $$;

-- ============================================================================
-- 1. ARREGLAR TABLA RESERVATIONS
-- ============================================================================

-- 🔧 Si existe 'date' pero no 'reservation_date', renombrar
DO $$
BEGIN
    -- Verificar si existe 'date' pero no 'reservation_date'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'date' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations RENAME COLUMN date TO reservation_date;
        RAISE NOTICE '✅ Renombrado: date → reservation_date';
    END IF;
END $$;

-- 🔧 Si existe 'time' pero no 'reservation_time', renombrar
DO $$
BEGIN
    -- Verificar si existe 'time' pero no 'reservation_time'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'time' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_time' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations RENAME COLUMN time TO reservation_time;
        RAISE NOTICE '✅ Renombrado: time → reservation_time';
    END IF;
END $$;

-- 🔧 Crear columnas faltantes en reservations
DO $$
BEGIN
    -- reservation_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN reservation_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ Creada columna: reservation_date';
    END IF;
    
    -- reservation_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'reservation_time' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN reservation_time TIME DEFAULT '19:00:00';
        RAISE NOTICE '✅ Creada columna: reservation_time';
    END IF;
    
    -- channel
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'channel' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN channel VARCHAR(50) DEFAULT 'manual';
        RAISE NOTICE '✅ Creada columna: channel';
    END IF;
    
    -- table_id (para relación con tables)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'table_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN table_id UUID;
        RAISE NOTICE '✅ Creada columna: table_id';
    END IF;
END $$;

-- ============================================================================
-- 2. ARREGLAR TABLA TABLES
-- ============================================================================

-- 🔧 Crear columnas faltantes en tables
DO $$
BEGIN
    -- zone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name = 'zone' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tables 
        ADD COLUMN zone VARCHAR(50) DEFAULT 'interior';
        RAISE NOTICE '✅ Creada columna: zone';
    END IF;
    
    -- name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name = 'name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tables 
        ADD COLUMN name VARCHAR(100);
        RAISE NOTICE '✅ Creada columna: name';
    END IF;
    
    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tables 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE '✅ Creada columna: status';
    END IF;
    
    -- table_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name = 'table_number' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tables 
        ADD COLUMN table_number VARCHAR(10);
        RAISE NOTICE '✅ Creada columna: table_number';
    END IF;
END $$;

-- ============================================================================
-- 3. POBLAR DATOS POR DEFECTO
-- ============================================================================

-- 🔧 Actualizar name de tables si está NULL
UPDATE public.tables 
SET name = CONCAT('Mesa ', COALESCE(table_number, id::text))
WHERE name IS NULL;

-- 🔧 Actualizar table_number si está NULL
UPDATE public.tables 
SET table_number = EXTRACT(EPOCH FROM created_at)::text
WHERE table_number IS NULL;

-- ============================================================================
-- 4. CREAR RELACIONES FOREIGN KEY
-- ============================================================================

-- 🔧 Foreign key: reservations.table_id → tables.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reservations_table' 
        AND table_name = 'reservations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_table 
        FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Creada FK: reservations.table_id → tables.id';
    END IF;
END $$;

-- 🔧 Foreign key: reservations.customer_id → customers.id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reservations_customer' 
        AND table_name = 'reservations'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'customer_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_customer 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Creada FK: reservations.customer_id → customers.id';
    END IF;
END $$;

-- ============================================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    reservations_final text[];
    tables_final text[];
BEGIN
    -- Verificar columnas finales de reservations
    SELECT array_agg(column_name ORDER BY column_name) INTO reservations_final
    FROM information_schema.columns 
    WHERE table_name = 'reservations' AND table_schema = 'public';
    
    RAISE NOTICE '✅ RESERVATIONS final: %', reservations_final;
    
    -- Verificar columnas finales de tables
    SELECT array_agg(column_name ORDER BY column_name) INTO tables_final
    FROM information_schema.columns 
    WHERE table_name = 'tables' AND table_schema = 'public';
    
    RAISE NOTICE '✅ TABLES final: %', tables_final;
    
    RAISE NOTICE '🎉 SCHEMA ARREGLADO - Todas las columnas necesarias creadas';
END $$;

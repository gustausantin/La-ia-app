-- ============================================================================
-- SCRIPT: ARREGLAR RELACIONES DUPLICADAS (PGRST201)
-- ============================================================================
-- SOLUCIÓN DEFINITIVA para "more than one relationship was found"
-- ============================================================================

-- 🔍 DIAGNÓSTICO: Verificar relaciones existentes
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '🔍 FOREIGN KEYS entre reservations y customers:';
    
    FOR fk_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'reservations'
        AND ccu.table_name = 'customers'
        AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE '📋 FK: % (%:%) → (%:%)', 
            fk_record.constraint_name,
            fk_record.table_name, 
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- ============================================================================
-- 1. ELIMINAR FOREIGN KEYS DUPLICADAS
-- ============================================================================

-- 🔧 Eliminar FK con nombres conocidos que pueden estar duplicados
DO $$
DECLARE
    constraint_names text[] := ARRAY[
        'fk_reservations_customer',
        'reservations_customer_id_fkey',
        'reservations_customer_fkey', 
        'fk_reservations_customers',
        'reservations_customers_fkey'
    ];
    current_constraint_name text;
BEGIN
    FOREACH current_constraint_name IN ARRAY constraint_names
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            WHERE tc.constraint_name = current_constraint_name
            AND tc.table_name = 'reservations'
            AND tc.table_schema = 'public'
        ) THEN
            EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS %I', current_constraint_name);
            RAISE NOTICE '✅ Eliminada FK duplicada: %', current_constraint_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 2. VERIFICAR COLUMNAS CUSTOMER EN RESERVATIONS
-- ============================================================================

DO $$
DECLARE
    customer_cols text[];
BEGIN
    -- Buscar todas las columnas que hacen referencia a customers
    SELECT array_agg(column_name) INTO customer_cols
    FROM information_schema.columns 
    WHERE table_name = 'reservations' 
    AND table_schema = 'public'
    AND (column_name LIKE '%customer%' OR column_name LIKE '%client%');
    
    RAISE NOTICE '📋 Columnas customer en reservations: %', customer_cols;
END $$;

-- ============================================================================
-- 3. CREAR UNA SOLA RELACIÓN LIMPIA
-- ============================================================================

-- 🔧 Crear UNA SOLA foreign key correcta
DO $$
BEGIN
    -- Solo si existe la columna customer_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'customer_id' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'customers'
        AND table_schema = 'public'
    ) THEN
        -- Crear una sola FK con nombre único
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_customer_single 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Creada FK ÚNICA: reservations.customer_id → customers.id';
    ELSE
        RAISE NOTICE '⚠️ No se pudo crear FK: columna customer_id o tabla customers no existe';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ FK ya existe - no es problema';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creando FK: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    fk_count INTEGER;
    fk_record RECORD;
BEGIN
    -- Contar FKs entre reservations y customers
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reservations'
    AND ccu.table_name = 'customers'
    AND tc.table_schema = 'public';
    
    RAISE NOTICE '📊 Total FKs reservations → customers: %', fk_count;
    
    IF fk_count = 1 THEN
        RAISE NOTICE '🎉 PERFECTO: Solo 1 relación entre reservations y customers';
        
        -- Mostrar la FK final
        FOR fk_record IN 
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'reservations'
            AND ccu.table_name = 'customers'
            AND tc.table_schema = 'public'
        LOOP
            RAISE NOTICE '✅ FK Final: % (reservations.% → customers.id)', 
                fk_record.constraint_name, fk_record.column_name;
        END LOOP;
        
    ELSIF fk_count = 0 THEN
        RAISE NOTICE '⚠️ No hay FKs entre reservations y customers';
    ELSE
        RAISE NOTICE '❌ AÚN HAY % FKs - revisar manualmente', fk_count;
    END IF;
END $$;

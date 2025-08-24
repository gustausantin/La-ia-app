-- ============================================================================
-- SCRIPT: ELIMINAR TODAS LAS RELACIONES Y RECREAR UNA LIMPIA
-- ============================================================================
-- SOLUCIÓN NUCLEAR para PGRST201 - Eliminar TODAS las FKs y recrear una sola
-- ============================================================================

-- 🔍 PASO 1: Listar TODAS las foreign keys existentes en reservations
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '🔍 === TODAS LAS FOREIGN KEYS EN RESERVATIONS ===';
    
    FOR fk_record IN 
        SELECT 
            tc.constraint_name,
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
        AND tc.table_schema = 'public'
        ORDER BY tc.constraint_name
    LOOP
        RAISE NOTICE '📋 FK: % | reservations.% → %.%', 
            fk_record.constraint_name,
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- ============================================================================
-- PASO 2: ELIMINAR TODAS LAS FOREIGN KEYS EN RESERVATIONS (NUCLEAR)
-- ============================================================================

DO $$
DECLARE
    fk_record RECORD;
    sql_command text;
BEGIN
    RAISE NOTICE '🗑️ === ELIMINANDO TODAS LAS FKs EN RESERVATIONS ===';
    
    -- Buscar y eliminar TODAS las foreign keys
    FOR fk_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'reservations'
        AND table_schema = 'public'
    LOOP
        sql_command := format('ALTER TABLE public.reservations DROP CONSTRAINT %I', fk_record.constraint_name);
        EXECUTE sql_command;
        RAISE NOTICE '✅ Eliminada FK: %', fk_record.constraint_name;
    END LOOP;
    
    RAISE NOTICE '🎯 Todas las FKs eliminadas de reservations';
END $$;

-- ============================================================================
-- PASO 3: VERIFICAR QUE NO QUEDAN FKs
-- ============================================================================

DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = 'reservations'
    AND table_schema = 'public';
    
    RAISE NOTICE '📊 FKs restantes en reservations: %', fk_count;
    
    IF fk_count = 0 THEN
        RAISE NOTICE '✅ PERFECTO: No quedan FKs en reservations';
    ELSE
        RAISE NOTICE '❌ ERROR: Aún quedan % FKs', fk_count;
    END IF;
END $$;

-- ============================================================================
-- PASO 4: VERIFICAR COLUMNAS DISPONIBLES
-- ============================================================================

DO $$
DECLARE
    cols_record RECORD;
BEGIN
    RAISE NOTICE '📋 === COLUMNAS EN RESERVATIONS ===';
    
    FOR cols_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND table_schema = 'public'
        ORDER BY column_name
    LOOP
        RAISE NOTICE '📋 Columna: % (%, nullable: %)', 
            cols_record.column_name,
            cols_record.data_type,
            cols_record.is_nullable;
    END LOOP;
END $$;

-- ============================================================================
-- PASO 5: VERIFICAR TABLAS DE DESTINO DISPONIBLES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 === TABLAS DISPONIBLES ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabla customers existe';
    ELSE
        RAISE NOTICE '❌ Tabla customers NO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabla tables existe';
    ELSE
        RAISE NOTICE '❌ Tabla tables NO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabla restaurants existe';
    ELSE
        RAISE NOTICE '❌ Tabla restaurants NO existe';
    END IF;
END $$;

-- ============================================================================
-- PASO 6: CREAR FOREIGN KEYS NUEVAS Y LIMPIAS
-- ============================================================================

-- 🔧 FK: reservations.customer_id → customers.id
DO $$
BEGIN
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
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_customer_clean
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Creada FK LIMPIA: reservations.customer_id → customers.id';
    ELSE
        RAISE NOTICE '⚠️ No se pudo crear FK customer_id (columna o tabla no existe)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creando FK customer_id: %', SQLERRM;
END $$;

-- 🔧 FK: reservations.table_id → tables.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'table_id' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tables'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_table_clean
        FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Creada FK LIMPIA: reservations.table_id → tables.id';
    ELSE
        RAISE NOTICE '⚠️ No se pudo crear FK table_id (columna o tabla no existe)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creando FK table_id: %', SQLERRM;
END $$;

-- 🔧 FK: reservations.restaurant_id → restaurants.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'restaurant_id' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'restaurants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_restaurant_clean
        FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Creada FK LIMPIA: reservations.restaurant_id → restaurants.id';
    ELSE
        RAISE NOTICE '⚠️ No se pudo crear FK restaurant_id (columna o tabla no existe)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creando FK restaurant_id: %', SQLERRM;
END $$;

-- ============================================================================
-- PASO 7: VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    fk_count INTEGER;
    customer_fk_count INTEGER;
    fk_record RECORD;
BEGIN
    -- Contar TODAS las FKs en reservations
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = 'reservations'
    AND table_schema = 'public';
    
    -- Contar específicamente FKs hacia customers
    SELECT COUNT(*) INTO customer_fk_count
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reservations'
    AND ccu.table_name = 'customers'
    AND tc.table_schema = 'public';
    
    RAISE NOTICE '📊 === RESULTADO FINAL ===';
    RAISE NOTICE '📊 Total FKs en reservations: %', fk_count;
    RAISE NOTICE '📊 FKs reservations → customers: %', customer_fk_count;
    
    IF customer_fk_count = 1 THEN
        RAISE NOTICE '🎉 PERFECTO: Solo 1 relación reservations → customers';
    ELSIF customer_fk_count = 0 THEN
        RAISE NOTICE '⚠️ No hay relación reservations → customers';
    ELSE
        RAISE NOTICE '❌ PROBLEMA: Hay % relaciones reservations → customers', customer_fk_count;
    END IF;
    
    -- Listar FKs finales
    RAISE NOTICE '📋 === FKs FINALES ===';
    FOR fk_record IN 
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'reservations'
        AND tc.table_schema = 'public'
        ORDER BY tc.constraint_name
    LOOP
        RAISE NOTICE '✅ FK Final: % | reservations.% → %', 
            fk_record.constraint_name,
            fk_record.column_name,
            fk_record.foreign_table_name;
    END LOOP;
    
    RAISE NOTICE '🎉 PROCESO COMPLETADO - Revisa la aplicación';
END $$;

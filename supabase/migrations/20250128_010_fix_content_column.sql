-- =====================================================
-- FIX: Corregir columna content vs content_markdown
-- Migración: 20250128_010_fix_content_column.sql
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA ACTUAL
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando estructura de message_templates...';
END $$;

-- 2. OPCIÓN A: Si existe columna 'content', renombrarla a 'content_markdown'
DO $$
BEGIN
    IF EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND column_name = 'content'
    ) THEN
        RAISE NOTICE '📝 Renombrando columna content → content_markdown';
        ALTER TABLE message_templates RENAME COLUMN content TO content_markdown;
    END IF;
END $$;

-- 3. OPCIÓN B: Si no existe 'content_markdown', agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND column_name = 'content_markdown'
    ) THEN
        RAISE NOTICE '➕ Agregando columna content_markdown';
        ALTER TABLE message_templates ADD COLUMN content_markdown TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 4. HACER content_markdown NOT NULL si no lo es
DO $$
BEGIN
    -- Verificar si content_markdown permite NULL
    IF EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND column_name = 'content_markdown'
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '🔧 Haciendo content_markdown NOT NULL';
        -- Primero llenar valores NULL con string vacío
        UPDATE message_templates SET content_markdown = '' WHERE content_markdown IS NULL;
        -- Después hacer NOT NULL
        ALTER TABLE message_templates ALTER COLUMN content_markdown SET NOT NULL;
    END IF;
END $$;

-- 5. VERIFICACIÓN FINAL
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '📋 ESTRUCTURA FINAL DE message_templates:';
    
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND table_schema = 'public'
        AND column_name IN ('content', 'content_markdown', 'segment', 'event_trigger')
        ORDER BY column_name
    LOOP
        RAISE NOTICE '  ✅ %: % (nullable: %)', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable;
    END LOOP;
END $$;

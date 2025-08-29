-- =====================================================
-- FIX FINAL: Eliminar columna content duplicada
-- =====================================================

-- 1. ELIMINAR LA COLUMNA 'content' (duplicada)
DO $$
BEGIN
    IF EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND column_name = 'content'
    ) THEN
        RAISE NOTICE '🗑️ Eliminando columna content duplicada...';
        ALTER TABLE message_templates DROP COLUMN content;
        RAISE NOTICE '✅ Columna content eliminada';
    ELSE
        RAISE NOTICE '⚠️ Columna content no existe';
    END IF;
END $$;

-- 2. VERIFICAR QUE content_markdown EXISTE Y ES NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND column_name = 'content_markdown'
    ) THEN
        RAISE NOTICE '✅ Columna content_markdown existe';
        
        -- Asegurar que es NOT NULL
        UPDATE message_templates SET content_markdown = '' WHERE content_markdown IS NULL;
        ALTER TABLE message_templates ALTER COLUMN content_markdown SET NOT NULL;
        
    ELSE
        RAISE NOTICE '❌ ERROR: content_markdown no existe';
    END IF;
END $$;

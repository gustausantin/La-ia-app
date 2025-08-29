-- =====================================================
-- VERIFICACIÓN Y CORRECCIÓN DE TABLAS CRM
-- Migración: 20250128_008_verify_and_fix_tables.sql
-- Autor: La-IA CRM Team
-- Descripción: Verifica y corrige estructura de tablas CRM
-- =====================================================

-- 1. VERIFICAR Y CREAR message_templates SI NO EXISTE
-- =====================================================

-- Primero, verificar si la tabla existe y tiene la estructura correcta
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'message_templates') THEN
        
        RAISE NOTICE 'Creando tabla message_templates...';
        
        -- Crear la tabla completa
        CREATE TABLE message_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
            
            -- Identificación y categorización
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            segment TEXT NOT NULL CHECK (segment IN ('nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor', 'all')),
            event_trigger TEXT NOT NULL,
            
            -- Contenido de la plantilla
            subject TEXT,
            content_markdown TEXT NOT NULL,
            variables TEXT[] DEFAULT ARRAY[]::TEXT[],
            
            -- Configuración de canales
            channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'both')),
            provider_template_name TEXT,
            
            -- Configuración de automatización
            is_active BOOLEAN DEFAULT true,
            send_delay_hours INTEGER DEFAULT 0,
            priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
            
            -- Metadatos
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            created_by UUID REFERENCES auth.users(id),
            
            UNIQUE(restaurant_id, name)
        );
        
    ELSE
        RAISE NOTICE 'Tabla message_templates ya existe, verificando columnas...';
        
        -- Verificar y agregar columnas faltantes
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'segment') THEN
            RAISE NOTICE 'Agregando columna segment...';
            ALTER TABLE message_templates ADD COLUMN segment TEXT NOT NULL DEFAULT 'all' 
                CHECK (segment IN ('nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor', 'all'));
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'event_trigger') THEN
            RAISE NOTICE 'Agregando columna event_trigger...';
            ALTER TABLE message_templates ADD COLUMN event_trigger TEXT NOT NULL DEFAULT 'manual';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'content_markdown') THEN
            RAISE NOTICE 'Agregando columna content_markdown...';
            ALTER TABLE message_templates ADD COLUMN content_markdown TEXT NOT NULL DEFAULT '';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'variables') THEN
            RAISE NOTICE 'Agregando columna variables...';
            ALTER TABLE message_templates ADD COLUMN variables TEXT[] DEFAULT ARRAY[]::TEXT[];
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'provider_template_name') THEN
            RAISE NOTICE 'Agregando columna provider_template_name...';
            ALTER TABLE message_templates ADD COLUMN provider_template_name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'send_delay_hours') THEN
            RAISE NOTICE 'Agregando columna send_delay_hours...';
            ALTER TABLE message_templates ADD COLUMN send_delay_hours INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'message_templates' 
                       AND column_name = 'priority') THEN
            RAISE NOTICE 'Agregando columna priority...';
            ALTER TABLE message_templates ADD COLUMN priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10);
        END IF;
        
    END IF;
END $$;

-- 2. HABILITAR RLS SI NO ESTÁ HABILITADO
-- =====================================================

DO $$
BEGIN
    -- Verificar si RLS está habilitado
    IF NOT EXISTS (SELECT FROM pg_tables 
                   WHERE schemaname = 'public' 
                   AND tablename = 'message_templates' 
                   AND rowsecurity = true) THEN
        
        RAISE NOTICE 'Habilitando RLS para message_templates...';
        ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
        
        -- Crear política si no existe
        IF NOT EXISTS (SELECT FROM pg_policies 
                       WHERE schemaname = 'public' 
                       AND tablename = 'message_templates' 
                       AND policyname = 'message_templates_tenant_isolation') THEN
            
            CREATE POLICY "message_templates_tenant_isolation" ON message_templates
                FOR ALL USING (
                    restaurant_id IN (
                        SELECT restaurant_id 
                        FROM user_restaurant_mapping 
                        WHERE auth_user_id = auth.uid()
                    )
                );
        END IF;
    END IF;
END $$;

-- 3. VERIFICAR OTRAS TABLAS CRM
-- =====================================================

-- Verificar automation_rules
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'automation_rules') THEN
        
        RAISE NOTICE 'ADVERTENCIA: Tabla automation_rules no existe. Ejecuta primero 20250128_005_crm_messaging_system.sql';
    END IF;
END $$;

-- Verificar scheduled_messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'scheduled_messages') THEN
        
        RAISE NOTICE 'ADVERTENCIA: Tabla scheduled_messages no existe. Ejecuta primero 20250128_005_crm_messaging_system.sql';
    END IF;
END $$;

-- 4. MOSTRAR ESTADO ACTUAL
-- =====================================================

-- Mostrar columnas actuales de message_templates
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '📋 COLUMNAS ACTUALES DE message_templates:';
    
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'message_templates' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable, 
            COALESCE(col_record.column_default, 'none');
    END LOOP;
END $$;

-- =====================================================
-- FIN DE VERIFICACIÓN Y CORRECCIÓN
-- =====================================================
